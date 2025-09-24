import os
import time
import logging
from datetime import datetime, timezone, timedelta

from app.adapters.db import get_session
from app.models import ChatMessage, RoomSummaryState
from app.services import summary_service, embed_service, error_service
from sqlalchemy import and_, or_
# ------------------
# Logging 설정
# ------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("summary-worker")

# 트리거 조건
UNSUM_THRESHOLD = int(os.getenv("SUMMARY_TRIGGER_COUNT", "10"))  # 10턴 단위
IDLE_SECONDS = int(os.getenv("SUMMARY_TRIGGER_IDLE_SEC", str(3600)))  # 1시간
POLL_INTERVAL = int(os.getenv("SUMMARY_TRIGGER_POLL_SEC", "30"))  # 30초마다 체크


def run_summary_trigger_loop():
    """주기적으로 room_summary_state 확인 → 요약 실행"""
    logger.info("🚀 Starting summary trigger loop (threshold=%d idle=%ds poll=%ds)",
                UNSUM_THRESHOLD, IDLE_SECONDS, POLL_INTERVAL)

    while True:
        try:
            with get_session() as session:
                now = datetime.now(timezone.utc)



                rooms = session.query(RoomSummaryState).filter(
                    or_(
                        RoomSummaryState.unsummarized_count >= UNSUM_THRESHOLD,
                        and_(
                            RoomSummaryState.unsummarized_count > 0,
                            or_(
                                RoomSummaryState.last_summary_at == None,
                                RoomSummaryState.last_summary_at < (now - timedelta(seconds=IDLE_SECONDS))
                            )
                        )
                    )
                ).all()


                logger.info("🔎 Found %d rooms requiring summarization", len(rooms))

            for state in rooms:
                logger.info("📌 Triggering summarization for room_id=%s unsum_count=%s last_summary_at=%s",
                            state.chat_room_id, state.unsummarized_count, state.last_summary_at)
                summarize_room(state.chat_room_id)

        except Exception as e:
            logger.exception("❌ Error in summary trigger loop")
            error_service.save_error(
                trace_id="SUMMARY_TRIGGER",
                error_type="SUMMARY_LOOP_ERROR",
                error=e,
            )

        time.sleep(POLL_INTERVAL)


def summarize_room(room_id: str):
    """특정 방 요약 실행"""
    logger.info("➡️ Summarizing room_id=%s", room_id)

    try:
        with get_session() as session:
            state = session.query(RoomSummaryState).filter_by(chat_room_id=room_id).first()
            if not state:
                logger.warning("⚠️ No RoomSummaryState found for room_id=%s", room_id)
                return

            last_turn_end = state.last_turn_end or 0

            messages = (
                session.query(ChatMessage)
                .filter(
                    and_(
                        ChatMessage.chat_room_id == room_id,
                        ChatMessage.turn_index > last_turn_end,
                    )
                )
                .order_by(ChatMessage.turn_index.asc())
                .limit(UNSUM_THRESHOLD * 2)
                .all()
            )

            logger.info("💬 Retrieved %d new messages for summarization (after turn=%d)",
                        len(messages), last_turn_end)

            if not messages:
                return

            # 요약 텍스트 블록
            text_block = "\n".join(
                [f"{m.role.upper()}: {m.filtered_content or m.content}" for m in messages]
            )
            logger.debug("📝 Text block for summary:\n%s", text_block)

            # 요약 생성
            summary_text = summary_service.summarize(text_block)
            logger.info("📝 Summary generated (len=%d)", len(summary_text))

            embedding = embed_service.embed_text(summary_text)
            logger.debug("📊 Embedding vector size=%d", len(embedding) if embedding else 0)

            embed_service.store_text(
                user_id=messages[-1].author_id,
                source_id=room_id,
                text=summary_text,
            )
            logger.info("💾 Stored summary embedding for room_id=%s", room_id)

            # 상태 업데이트
            state.last_turn_end = messages[-1].turn_index
            state.last_summary_at = datetime.now(timezone.utc)
            state.unsummarized_count = 0
            session.add(state)
            session.commit()

            logger.info("✅ Room %s summarized up to turn %d",
                        room_id, state.last_turn_end)

    except Exception as e:
        logger.exception("❌ Error while summarizing room_id=%s", room_id)
        error_service.save_error(
            trace_id=room_id,
            error_type="SUMMARY_ROOM_ERROR",
            error=e,
        )


if __name__ == "__main__":
    run_summary_trigger_loop()
