import os
from datetime import datetime, timezone
from typing import List

import torch
from transformers import AutoTokenizer, AutoModel
from app.adapters.db import get_session
from app.models import UserMemoryEmbedding
from app.adapters.es import get_es_client


# ===== 모델 로드 =====
EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_PATH", "/app/models/embedding")

tokenizer = AutoTokenizer.from_pretrained(EMBED_MODEL_PATH)
model = AutoModel.from_pretrained(EMBED_MODEL_PATH)
model.eval()


def embed_text(text: str) -> List[float]:
    """서버에 올린 임베딩 모델로 문장을 벡터화"""
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
    with torch.no_grad():
        outputs = model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().tolist()
    return embeddings


def store_user_memory_embedding(user_id, room_id, content: str, embedding: List[float], timestamp: str):
    """임베딩 결과를 DB와 ES에 저장"""
    # === DB 저장 ===
    with get_session() as session:
        row = UserMemoryEmbedding(
            user_id=user_id,
            chat_room_id=room_id,
            content=content,
            embedding=embedding,
            created_at=datetime.fromisoformat(timestamp).replace(tzinfo=timezone.utc),
        )
        session.add(row)
        session.commit()

    # === ES 저장 ===
    try:
        es = get_es_client()
        es.index(
            index=os.getenv("USER_MEMORY_EMBED_INDEX", "user_memory_embedding"),
            document={
                "user_id": str(user_id),
                "chat_room_id": str(room_id),
                "content": content,
                "embedding": embedding,
                "timestamp": timestamp,
            },
        )
    except Exception as e:
        print(f"[embed_service] ES 저장 실패: {e}")
