from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/embed", tags=["embed"])

@router.post("/store")
def store_text(payload: dict):
    user_seq = payload.get("user_seq")
    text = payload.get("text")
    # TODO: local_pipeline.embed_store.save_embedding
    return {"status": "ok", "user_seq": user_seq, "text": text}

@router.get("/search")
def search_texts(
    user_seq: int = Query(...),
    q: str = Query(...),
    k: int = Query(5)
):
    # TODO: local_pipeline.embed_search.search_similar
    return {"status": "ok", "query": q, "results": []}
