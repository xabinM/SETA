import uuid
import datetime
from app.utils.es import get_es
from app.core.config import get_settings
from .model import get_embedding

_settings = get_settings()
es = get_es()
INDEX_NAME = _settings.EMBED_INDEX_NAME


def save_embedding(user_id: str, source_id: str, content: str) -> str:
    """
    user_id 전체 대화 기준으로 embedding 저장
    - user_id: 사용자 ID
    - source_id: 메시지/출처 ID
    - content: 원문 텍스트
    """
    emb = get_embedding(content)
    embedding_id = str(uuid.uuid4())

    doc = {
        "embedding_id": embedding_id,             # PK 역할
        "user_id": user_id,                       # 사용자 구분
        "source_id": source_id,                   # 메시지/출처 ID
        "content": content,                       # 원문
        "embedding": emb,                         # 벡터
        "created_at": datetime.datetime.utcnow()  # 저장 시각 (UTC)
    }

    es.index(index=INDEX_NAME, id=embedding_id, document=doc)
    return embedding_id
