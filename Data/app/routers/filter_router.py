from fastapi import APIRouter

router = APIRouter(prefix="/api/filter", tags=["filter"])

@router.post("")
def filter_text(payload: dict):
    text = payload.get("text", "")
    return {"status": "ok", "received_text": text}
