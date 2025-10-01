import uuid
from datetime import datetime, timezone
import os

from app.utils.es import get_es

es = get_es()
INDEX_NAME = os.getenv("EMBED_INDEX_NAME", "user_memory_embedding")


def save_embedding(user_id: str, source_id: str, content: str, embedding) -> str:
    """
    ES에 직접 저장만 담당 (임베딩은 외부에서 주입)
    """
    embedding_id = str(uuid.uuid4())
    doc = {
        "embedding_id": embedding_id,
        "user_id": str(user_id),
        "source_id": str(source_id),
        "content": content,
        "embedding": embedding,
        "created_at": datetime.now(timezone.utc),
    }
    es.index(index=INDEX_NAME, document=doc)
    return embedding_id
