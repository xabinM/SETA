import os
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.adapters.db import get_session
from app.models import ChatMessage, RoomSummaryState, PromptBuilt
from app.adapters.es import get_es_client
from sentence_transformers import SentenceTransformer
from app.services.llm_client import call_llm

EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_PATH", "/app/models/embedding")
embedder = SentenceTransformer(EMBED_MODEL_PATH)

TURN_LIMIT = 20
IDLE_MINUTES = 60

def run_worker():
    with get_session() as session:
        rooms = session.query(RoomSummaryState).all()
        for rs in rooms:
            room_id = rs.chat_room_id
            last_summary_at = rs.last_summary_at or datetime(1970,1,1,tzinfo=timezone.utc)
            last_turn = rs.last_turn_end or 0

            # 1) 최근 메시지 확인
            msgs = (
                session.query(ChatMessage)
                .filter(ChatMessage.chat_room_id == room_id)
                .order_by(ChatMessage.turn_index)
                .all()
            )
            if not msgs:
                continue

            latest_turn = msgs[-1].turn_index
            latest_time = msgs[-1].created_at

            need_summary = False
            if latest_turn - last_turn >= TURN_LIMIT:
                need_summary = True
            elif (datetime.now(timezone.utc) - latest_time) > timedelta(minutes=IDLE_MINUTES):
                need_summary = True

            if not need_summary:
                continue

            # 2) 요약 생성 (LLM)
            text_to_summarize = "\n".join([f"{m.role}: {m.content}" for m in msgs[last_turn:]])
            summary, _ = call_llm(
                model="gpt-4o-mini",
                prompt=f"다음을 간결히 요약해 주세요:\n\n{text_to_summarize}",
                temperature=0.3
            )

            # 3) 임베딩 생성
            emb = embedder.encode(summary).tolist()

            # 4) DB 저장
            pb = PromptBuilt(
                trace_id=f"summary-{room_id}-{datetime.now().timestamp()}",
                built_prompt=f"요약: {summary}",
                context_messages=[],
                created_at=datetime.now(timezone.utc),
            )
            session.add(pb)

            rs.last_turn_end = latest_turn
            rs.last_summary_at = datetime.now(timezone.utc)
            session.add(rs)
            session.commit()

            # 5) ES 저장
            es = get_es_client()
            doc = {
                "room_id": room_id,
                "summary_text": summary,
                "embedding_vector": emb,
                "created_at": int(datetime.now(timezone.utc).timestamp() * 1000),
            }
            es.index(index="room-summary", document=doc)

            print(f"[SummaryWorker] Room {room_id} 요약 저장 완료")
