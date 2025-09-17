from fastapi import APIRouter

router = APIRouter(prefix="/api/summarize", tags=["summary"])

@router.post("")
def summarize(payload: dict):
    room_id = payload.get("room_id")
    current_turn = payload.get("current_turn", 0)
    # TODO: local_pipeline.conversation_summarizer.summarize_text
    return {"status": "ok", "room_id": room_id, "current_turn": current_turn}
