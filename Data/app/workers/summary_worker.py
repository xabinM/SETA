import os
import time
import logging
from datetime import datetime, timezone, timedelta

from app.adapters.db import get_session
from app.models import ChatMessage, RoomSummaryState
from app.services import summary_service, embed_service, error_service
from sqlalchemy import and_, or_

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("summary-worker")

# 트리거 조건
UNSUM_THRESHOLD = int(os.getenv("SUMMARY_TRIGGER_COUNT", "10"))  # 10턴 단위
IDLE_SECONDS = int(os.getenv("SUMMARY_TRIGGER_IDLE_SEC", str(3600)))  # 1시간
POLL_INTERVAL = int(os.getenv("SUMMARY_TRIGGER_POLL_SEC", "30"))  # 30초마다 체크


def log_summary_process(room_id: str, messages, summary_text: str):
    try:
        lines = []
        lines.append("📝 [요약 과정 요약]")
        lines.append(f"  📌 대상 채팅방: {room_id}")
        lines.append(f"  📥 새 메시지 개수: {len(messages)}")

        if messages:
            lines.append("  💬 새 메시지 목록:")
            for m in messages[-5:]:
                lines.append(f"    {m.role.upper()}: {m.filtered_content or m.content}")
            if len(messages) > 5:
                lines.append(f"    ... (총 {len(messages)}개)")

        lines.append(f"  ✨ 생성된 요약 (길이={len(summary_text)}):")
        lines.append(f"    {summary_text[:100]}{'...' if len(summary_text) > 100 else ''}")

        logger.info("\n" + "\n".join(lines))

    except Exception as e:
        logger.warning("⚠️ 요약 로그 출력 중 오류: %s", e)


def run_summary_trigger_loop():
    while True:
        try:
            with get_session() as session:
                now = datetime.now(timezone.utc)

                rooms = session.query(RoomSummaryState).filter(
                    or_(
                        RoomSummaryState.unsummarized_count >= UNSUM_THRESHOLD,
                        and_(
                            RoomSummaryState.unsummarized_count > 0,
                            RoomSummaryState.last_summary_at < (now - timedelta(seconds=IDLE_SECONDS))
                        )
                    )
                ).all()

            for state in rooms:
                summarize_room(state.chat_room_id)

        except Exception as e:
            error_service.save_error(
                trace_id="SUMMARY_TRIGGER",
                error_type="SUMMARY_LOOP_ERROR",
                error=e,
            )

        time.sleep(POLL_INTERVAL)


def summarize_room(room_id: str):
    """특정 방 요약 실행"""
    try:
        with get_session() as session:
            state = session.query(RoomSummaryState).filter_by(chat_room_id=room_id).first()
            if not state:
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

            if not messages:
                return

            # 요약 텍스트 블록
            text_block = "\n".join(
                [f"{m.role.upper()}: {m.filtered_content or m.content}" for m in messages]
            )

            # 요약 생성
            summary_text = summary_service.summarize(text_block)

            # ES 임베딩 저장
            embedding = embed_service.embed_text(summary_text)
            embed_service.store_text(
                user_id=messages[-1].author_id,
                source_id=room_id,
                text=summary_text,
            )

            # 상태 업데이트
            state.last_turn_end = messages[-1].turn_index
            state.last_summary_at = datetime.now(timezone.utc)
            state.unsummarized_count = 0
            session.add(state)
            session.commit()

            # 발표용 로그 출력
            log_summary_process(room_id, messages, summary_text)

    except Exception as e:
        error_service.save_error(
            trace_id=room_id,
            error_type="SUMMARY_ROOM_ERROR",
            error=e,
        )


if __name__ == "__main__":
    run_summary_trigger_loop()
