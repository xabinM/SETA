import os
import time
import json
import logging
from datetime import datetime, timezone

from app.models import RoomSummaryState, PromptBuilt, TokenUsage
from app.adapters.kafka_io import make_consumer, make_producer, publish, read_headers
from app.utils.trace import extract_traceparent
from app.adapters.db import get_session
from app.services import prompt_builder_service, llm_client, error_service
from app.adapters.redis_io import append_conversation
from app.utils.usage import estimate_usage_by_tokens  # ✅ 소비량 계산 유틸

# ------------------
# Logging 설정
# ------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("llm-worker")

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_LLM", "chat.filter.result.v1")
KAFKA_OUT_DELTA = os.getenv("KAFKA_TOPIC_OUT_LLM_DELTA", "chat.llm.answer.delta.v1")
KAFKA_OUT_DONE = os.getenv("KAFKA_TOPIC_OUT_LLM_DONE", "chat.llm.answer.done.v1")


def run_worker():
    logger.info("🚀 Starting LLM worker. Subscribing to %s", KAFKA_IN)
    consumer = make_consumer([KAFKA_IN], group_id="llm-worker")
    producer = make_producer()
    logger.info("✅ Kafka consumer/producer ready.")

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            logger.error("❌ Kafka error: %s", msg.error())
            continue

        try:
            ev = json.loads(msg.value().decode("utf-8"))
            logger.info("📩 Received event: %s", ev)
        except Exception as e:
            logger.error("❌ Failed to decode Kafka message: %s", e)
            continue

        headers_dict = read_headers(msg)
        tp = extract_traceparent(headers_dict)

        # --- PASS만 처리 ---
        decision = ev.get("decision") or {}
        action = decision.get("action") or ev.get("action")
        if action != "PASS":
            logger.info("⏩ Skipping message (action=%s)", action)
            continue

        trace_id = ev.get("trace_id")
        chat_room_id = ev.get("room_id")
        message_id = ev.get("message_id")
        user_id = ev.get("user_id")
        user_id = int(user_id) if user_id is not None else None

        # 입력 텍스트 확보
        user_input = ev.get("cleaned_text") or ev.get("original_text")  or ""

        logger.info("➡️ Processing trace_id=%s room_id=%s", trace_id, chat_room_id)

        try:
            with get_session() as session:
                logger.info("⚙️ Building prompt for user_id=%s", user_id)

                # 1) system_prompt
                system_prompt = prompt_builder_service.build_system_prompt(session, user_id)
                system_prompt += "\n\n답변은 반드시 마크다운 형식으로 작성하세요."

                # 2) 최근 대화 맥락
                context_snippets = [
                    f"{m['role']}: {m['content']}" for m in prompt_builder_service.get_recent_conversation(chat_room_id, limit=10)
                ]
                logger.info("📝 Context snippets: %d items", len(context_snippets))

                # 3) ES embedding 기반 검색
                similar_contexts = prompt_builder_service.search_similar_context_es(
                    query=user_input,
                    user_id=user_id,
                    top_k=3,
                    min_score=0.7
                )
                logger.info("🔍 Similar contexts: %d items", len(similar_contexts) if similar_contexts else 0)

                # 4) full_prompt 조립
                full_prompt = (
                    f"System: {system_prompt}\n\n"
                    + "\n".join(context_snippets)
                    + ("\n\n[과거 유사 맥락]\n" + "\n".join(similar_contexts) if similar_contexts else "")
                    + (f"\n\n유저: {user_input}" if user_input else "")
                )

                # 5) PromptBuilt 저장
                pb = PromptBuilt(
                    trace_id=trace_id,
                    built_prompt=full_prompt,
                    context_messages=context_snippets,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(pb)
                session.commit()
                logger.info("💾 PromptBuilt saved (trace_id=%s)", trace_id)

        except Exception as e:
            logger.exception("❌ Prompt build failed")
            error_service.save_error(trace_id=trace_id, error_type="PROMPT_BUILD_ERROR", error=e)
            continue

        # === LLM 호출 ===
        start = time.time()
        model_name = os.getenv("LLM_MODEL", "gpt-4.1-nano")
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        logger.info("🤖 Calling LLM model=%s temperature=%.2f", model_name, temperature)

        chunks = []
        try:
            for event in llm_client.call_llm(full_prompt, stream=True, model=model_name, temperature=temperature):
                if event["type"] == "delta":
                    delta = event["delta"]
                    chunks.append(delta)
                    logger.debug("✏️ Delta chunk: %s", delta)

                    try:
                        publish(
                            producer,
                            KAFKA_OUT_DELTA,
                            key=chat_room_id,
                            value={
                                "trace_id": trace_id,
                                "room_id": chat_room_id,
                                "message_id": message_id,
                                "delta": delta,
                                "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                            },
                            headers=[("traceparent", tp.encode())] if tp else None,
                        )
                        logger.debug("📡 Published delta chunk")
                    except Exception as e:
                        logger.exception("❌ Failed to publish delta")
                        error_service.save_error(trace_id, "KAFKA_DELTA_ERROR", e)

                elif event["type"] == "done":
                    usage = event["usage"]
                    latency_ms = int((time.time() - start) * 1000)
                    full_text = "".join(chunks)
                    logger.info("✅ LLM done (latency=%dms tokens=%s)", latency_ms, usage)

                    # TokenUsage 저장 (실제 사용량 계산)
                    try:
                        with get_session() as session:
                            total_tokens = usage.get("total_tokens", 0)
                            cost_usd, energy_wh, co2_g, water_ml = estimate_usage_by_tokens(total_tokens)

                            token_usage = TokenUsage(
                                message_id=message_id,
                                user_id=user_id,
                                prompt_tokens=usage.get("prompt_tokens", 0),
                                completion_tokens=usage.get("completion_tokens", 0),
                                total_tokens=total_tokens,
                                cost_usd=cost_usd,
                                energy_wh=energy_wh,
                                co2_g=co2_g,
                                saved_tokens=0,
                                saved_cost_usd=0,
                                saved_energy_wh=0,
                                saved_co2_g=0,
                                created_at=datetime.now(timezone.utc),
                            )
                            session.add(token_usage)
                            session.commit()
                        logger.info("💾 TokenUsage saved")
                    except Exception as e:
                        logger.exception("❌ Failed to save TokenUsage")
                        error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                    # Redis Append (user + assistant 대화 저장)
                    try:
                        append_conversation(
                            room_id=chat_room_id,
                            role="user",
                            content=user_input,
                        )
                        append_conversation(
                            room_id=chat_room_id,
                            role="assistant",
                            content=full_text,
                        )
                        logger.info("💾 Redis conversation appended")
                    except Exception as e:
                        logger.exception("❌ Redis append failed")
                        error_service.save_error(trace_id, "REDIS_APPEND_ERROR", e)

                    # unsummarized_count++
                    try:
                        with get_session() as session:
                            state = session.query(RoomSummaryState).filter_by(chat_room_id=chat_room_id).first()
                            if state:
                                state.unsummarized_count = (state.unsummarized_count or 0) + 1
                                if state.last_summary_at is None:
                                    state.last_summary_at = datetime.now(timezone.utc)
                                session.commit()
                        logger.info("🔄 Updated unsummarized_count")
                    except Exception as e:
                        logger.exception("❌ Failed to update RoomSummaryState")
                        error_service.save_error(trace_id, "DB_UPDATE_ERROR", e)

                    # Kafka DONE 발행
                    try:
                        publish(
                            producer,
                            KAFKA_OUT_DONE,
                            key=chat_room_id,
                            value={
                                "trace_id": trace_id,
                                "room_id": chat_room_id,
                                "message_id": message_id,
                                "response": {"text": full_text},
                                "usage": usage,
                                "latency_ms": latency_ms,
                                "schema_version": "1.0.0",
                                "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                            },
                            headers=[("traceparent", tp.encode())] if tp else None,
                        )
                        logger.info("📡 Published DONE → %s", KAFKA_OUT_DONE)
                    except Exception as e:
                        logger.exception("❌ Failed to publish DONE")
                        error_service.save_error(trace_id, "KAFKA_DONE_ERROR", e)

        except Exception as e:
            logger.exception("❌ LLM call failed")
            error_service.save_error(trace_id, "LLM_CALL_ERROR", e)


if __name__ == "__main__":
    run_worker()
