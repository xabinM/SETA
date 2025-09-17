# app/pipelines/embedding/model.py
import math, hashlib
from sentence_transformers import SentenceTransformer
from app.core.config import get_settings

_settings = get_settings()
_model: SentenceTransformer | None = None


def _fallback_hash_embedding(text: str) -> list[float]:
    """
    모델 로딩 실패 시 해시 기반 임시 임베딩 생성 (디버깅용)
    """
    dims = _settings.EMBED_DIMS
    if not text:
        return [0.0] * dims
    vec = [0.0] * dims
    for tok in text.split():
        h = int(hashlib.md5(tok.encode("utf-8")).hexdigest(), 16)
        idx = h % dims
        vec[idx] += ((h % 1000) / 1000.0) - 0.5
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def get_model() -> SentenceTransformer | None:
    global _model
    if _model is None:
        try:
            _model = SentenceTransformer(_settings.EMBEDDING_MODEL_PATH)
            print(f"[embedding.model] Loaded model from {_settings.EMBEDDING_MODEL_PATH}")
        except Exception as e:
            print(f"[embedding.model] fallback (reason: {e})")
            _model = None
    return _model


def get_embedding(text: str) -> list[float]:
    m = get_model()
    if m is None:
        return _fallback_hash_embedding(text)
    emb = m.encode(text, normalize_embeddings=True)
    return emb.tolist() if hasattr(emb, "tolist") else list(emb)
