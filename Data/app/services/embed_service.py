import os
from datetime import datetime, timezone
from typing import List

import torch
from transformers import AutoTokenizer, AutoModel
from app.pipelines.embedding.store import save_embedding
from app.pipelines.embedding.search import search_similar


# ===== 모델 로드 =====
EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_PATH", "/app/models/embedding")

tokenizer = AutoTokenizer.from_pretrained(EMBED_MODEL_PATH, local_files_only=True)
model = AutoModel.from_pretrained(EMBED_MODEL_PATH, local_files_only=True)
model.eval()


from app.pipelines.embedding.store import save_embedding
from app.pipelines.embedding.search import search_similar

# === 라우터에서 기대하는 Thin Wrapper 추가 ===s

def store_text(user_id: str, source_id: str, text: str) -> str:
    """
    사용자 전체 대화 기준 memory embedding 저장
    - user_id: 사용자 ID
    - source_id: 메시지/출처 ID
    - text: 원본 텍스트
    """
    return save_embedding(
        user_id=user_id,
        source_id=source_id,
        content=text
    )

def search_texts(user_id: str, q: str, k: int = 5, min_score: float = 0.7):
    """
    특정 user_id의 전체 대화에서 semantic search 실행
    - user_id: 사용자 ID
    - q: 검색할 쿼리 텍스트
    - k: 반환할 개수
    - min_score: 최소 유사도 점수
    """
    return search_similar(
        user_id=user_id,
        query=q,
        k=k,
        min_score=min_score
    )


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
        es = get_es()
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
