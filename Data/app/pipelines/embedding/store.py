# app/pipelines/embedding/store.py
import uuid, datetime
from app.utils.es import get_es
from app.core.config import get_settings
from .model import get_embedding

_settings = get_settings()
es = get_es()
INDEX_NAME = _settings.EMBED_INDEX_NAME


def save_embedding(user_seq: int, text: str) -> str:
    emb = get_embedding(text)
    trace_id = str(uuid.uuid4())
    doc = {
        "user_seq":   str(user_seq),              # 검색 필터용
        "trace_id":   trace_id,                   # 추적용 UUID
        "content":    text,                       # 원문
        "embedding":  emb,                        # 벡터
        "created_at": datetime.datetime.utcnow()  # 저장 시각
    }
    es.index(index=INDEX_NAME, document=doc)
    return trace_id
