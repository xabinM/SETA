# app/pipelines/embedding/index.py
from app.utils.es import get_es
from app.core.config import get_settings

_settings = get_settings()
es = get_es()
INDEX_NAME = _settings.EMBED_INDEX_NAME
EMBED_DIMS = _settings.EMBED_DIMS

MAPPING = {
  "mappings": {"properties": {
    "user_id":   {"type": "keyword"},
    "source_id": {"type": "keyword"},
    "content":   {"type": "text"},
    "embedding": {"type": "dense_vector", "dims": EMBED_DIMS, "index": True, "similarity": "cosine"},
    "created_at":{"type": "date"}
}}}


def create_index_if_needed():
    try:
        if not es.indices.exists(index=INDEX_NAME):
            es.indices.create(index=INDEX_NAME, mappings=MAPPING["mappings"])
    except Exception as e:
        print(f"[embedding.index] create_index_if_needed warning: {e}")
