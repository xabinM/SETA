from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.adapters.db import get_session
from app.contracts.raw_filtered import RawFilteredMessage
from app.services.chat_service import process_user_message
from app.adapters.db import get_db
router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/send")
def send_message(payload: RawFilteredMessage, session: Session = Depends(get_session)):
    """
    사용자 메시지를 받아 GPT 응답 생성 후 반환
    - system prompt + redis 최근 대화 + ES 유사 맥락 → GPT 호출
    - 답변 Redis에 저장
    """
    try:
        reply = process_user_message(session, payload)
        return {
            "trace_id": payload.trace_id,
            "user_id": payload.user_id,
            "room_id": payload.room_id,
            "user_message": payload.text,
            "assistant_reply": reply,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
