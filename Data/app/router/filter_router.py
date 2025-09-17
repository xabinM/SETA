from fastapi import APIRouter

router = APIRouter(prefix="/api/filter", tags=["filter"])

@router.post("")
def filter_text(payload: dict):
    text = payload.get("text", "")
    # TODO: local_pipeline.filter_pipeline 호출
    return {"status": "ok", "received_text": text}
