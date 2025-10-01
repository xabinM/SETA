import os
from typing import List
from sentence_transformers import SentenceTransformer

from app.pipelines.embedding.store import save_embedding
from app.pipelines.embedding.search import search_similar

EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_PATH", "/app/models/embedding")
model = SentenceTransformer(EMBED_MODEL_PATH)


def embed_text(text: str) -> List[float]:
    """SentenceTransformer 기반 임베딩 생성"""
    emb = model.encode([text])[0]
    return emb.tolist()


def store_text(user_id: str, source_id: str, text: str) -> str:
    """텍스트를 임베딩 후 ES에 저장"""
    embedding = embed_text(text)
    return save_embedding(
        user_id=user_id,
        source_id=source_id,
        content=text,
        embedding=embedding,
    )


def search_texts(user_id: str, q: str, k: int = 5, min_score: float = 0.7):
    """쿼리 텍스트를 임베딩 후 ES에서 semantic search"""
    embedding = embed_text(q)
    return search_similar(
        user_id=user_id,
        embedding=embedding,
        k=k,
        min_score=min_score,
    )
