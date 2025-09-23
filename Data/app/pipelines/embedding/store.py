import uuid
from datetime import datetime, timezone
import os

from app.utils.es import get_es
from app.services.embed_service import embed_text

es = get_es()
INDEX_NAME = os.getenv("EMBED_INDEX_NAME", "user_memory_embedding")


def save_embedding(user_id: str, source_id: str, content: str) -> str:
    """
    사용자 전체 대화 기준 memory embedding 저장
    - user_id: 사용자 ID
    - source_id: 메시지/출처 ID
    - content: 원문
    """
    embedding = embed_text(content)
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
