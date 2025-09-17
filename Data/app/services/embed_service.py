# app/services/embed_service.py
from app.pipelines.embedding.index import create_index_if_needed
from app.pipelines.embedding.store import save_embedding
from app.pipelines.embedding.search import search_similar


def init_embedding():
    """
    앱 시작 시 Elasticsearch 인덱스 보장
    """
    create_index_if_needed()


def store_text(user_seq: int, text: str) -> str:
    """
    텍스트를 임베딩 후 ES에 저장
    반환: trace_id
    """
    return save_embedding(user_seq, text)


def search_texts(user_seq: int, q: str, k: int = 5, min_score: float = 0.7):
    """
    ES에서 유사 텍스트 검색
    반환: [{content, score, trace_id}, ...]
    """
    return search_similar(user_seq, q, k=k, min_score=min_score)
