# app/routers/embed.py
from fastapi import APIRouter, Query
from app.schemas.embed import EmbedStoreIn, EmbedStoreOut, EmbedSearchOut, EmbedSearchOutItem
from app.services.embed_service import store_text, search_texts

router = APIRouter(prefix="/api/embed", tags=["embed"])


@router.post("/store", response_model=EmbedStoreOut)
def store(payload: EmbedStoreIn):
    trace_id = store_text(payload.user_seq, payload.text)
    return {"status": "ok", "trace_id": trace_id}


@router.get("/search", response_model=EmbedSearchOut)
def search(
    user_seq: int = Query(..., description="사용자 ID"),
    q: str = Query(..., description="검색 질의 텍스트"),
    k: int = Query(5, description="가져올 개수"),
    min_score: float = Query(0.7, description="최소 유사도 점수"),
):
    hits = search_texts(user_seq, q, k=k, min_score=min_score)
    items = [EmbedSearchOutItem(**h) for h in hits]
    return {"status": "ok", "hits": items}
