from fastapi import APIRouter, Query
from app.schemas.embed import EmbedStoreIn, EmbedStoreOut, EmbedSearchOut, EmbedSearchOutItem
from app.services.embed_service import store_text, search_texts

router = APIRouter(prefix="/api/embed", tags=["embed"])


@router.post("/store", response_model=EmbedStoreOut)
def store(payload: EmbedStoreIn):
    """
    메모리 임베딩 저장 API
    - user_id: 사용자 ID
    - source_id: 메시지/출처 ID
    - text: 원문 텍스트
    """
    embedding_id = store_text(payload.user_id, payload.source_id, payload.text)
    return {"status": "ok", "embedding_id": embedding_id}


@router.get("/search", response_model=EmbedSearchOut)
def search(
    user_id: str = Query(..., description="사용자 ID"),
    q: str = Query(..., description="검색 질의 텍스트"),
    k: int = Query(5, description="가져올 개수"),
    min_score: float = Query(0.7, description="최소 유사도 점수"),
):
    """
    특정 user_id 메모리에서 semantic search
    """
    hits = search_texts(user_id, q, k=k, min_score=min_score)
    items = [EmbedSearchOutItem(**h) for h in hits]
    return {"status": "ok", "hits": items}
