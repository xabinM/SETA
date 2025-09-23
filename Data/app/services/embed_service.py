import os
from datetime import datetime, timezone
from typing import List
from sentence_transformers import SentenceTransformer

from app.pipelines.embedding.store import save_embedding
from app.pipelines.embedding.search import search_similar
from app.utils.es import get_es

# ===== 모델 로드 =====
EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_PATH", "/app/models/embedding")
model = SentenceTransformer(EMBED_MODEL_PATH)


# === 라우터에서 기대하는 Thin Wrapper 추가 ===
def store_text(user_id: str, source_id: str, text: str) -> str:
    return save_embedding(user_id=user_id, source_id=source_id, content=text)


def search_texts(user_id: str, q: str, k: int = 5, min_score: float = 0.7):
    return search_similar(user_id=user_id, query=q, k=k, min_score=min_score)


def embed_text(text: str) -> List[float]:
    emb = model.encode([text])[0]
    return emb.tolist()


def store_user_memory_embedding(user_id: str, source_id: str, content: str):
    """직접 ES에 저장 (store_text 래퍼 대신 쓸 경우)"""
    es = get_es()
    emb = embed_text(content)
    try:
        es.index(
            index=os.getenv("EMBED_INDEX_NAME", "user_memory_embedding"),
            document={
                "embedding_id": f"{user_id}-{source_id}",
                "user_id": str(user_id),
                "source_id": str(source_id),
                "content": content,
                "embedding": emb,
                "created_at": datetime.now(timezone.utc),
            },
        )
    except Exception as e:
        print(f"[embed_service] ES 저장 실패: {e}")
