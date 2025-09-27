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
from app.utils.usage import estimate_usage_by_tokens


logging.basicConfig(
    level=logging.DEBUG,   # INFO → DEBUG 로 변경
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("llm-worker")

# ElasticSearch, huggingface, httpx 내부 로그 감추기
logging.getLogger("elastic_transport.transport").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("transformers").setLevel(logging.WARNING)
logging.getLogger("tokenizers").setLevel(logging.WARNING)

# huggingface tokenizers warning 제거
os.environ["TOKENIZERS_PARALLELISM"] = "false"

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_LLM", "chat.filter.result.v1")
KAFKA_OUT_DELTA = os.getenv("KAFKA_TOPIC_OUT_LLM_DELTA", "chat.llm.answer.delta.v1")
KAFKA_OUT_DONE = os.getenv("KAFKA_TOPIC_OUT_LLM_DONE", "chat.llm.answer.done.v1")


def log_llm_process(user_input: str, system_prompt: str, context_snippets: list,
                    similar_contexts: list, full_text: str = None, usage: dict = None):
    try:
        lines = []
        lines.append("🤖 [LLM 처리 과정 요약]")

        lines.append(f"  📝 유저 입력: \"{user_input}\"")

        lines.append("  ⚙️ 시스템 프롬프트:")
        for sp_line in system_prompt.splitlines():
            lines.append(f"    {sp_line}")

        if context_snippets:
            lines.append("  💬 최근 대화 맥락:")
            for i, ctx in enumerate(context_snippets, 1):
                lines.append(f"    {i}) {ctx}")
        else:
            lines.append("  💬 최근 대화 맥락 없음")

        if similar_contexts:
            lines.append("  🔍 유사 맥락(ES):")
            for i, ctx in enumerate(similar_contexts, 1):
                if isinstance(ctx, dict):
                    text = ctx.get("text", "")
                    score = ctx.get("score", 0)
                    preview = text[:100] + "..." if len(text) > 100 else text
                    lines.append(f"    {i}) (점수={score:.2f}) {preview}")
                else:
                    preview = ctx[:100] + "..." if len(ctx) > 100 else ctx
                    lines.append(f"    {i}) {preview}")
        else:
            lines.append("  🔍 유사 맥락 없음")

        if full_text is not None:
            lines.append(f"  ✅ LLM 최종 답변: {full_text[:100]}{'...' if len(full_text) > 100 else ''}")

        if usage:
            lines.append(
                f"  📊 토큰 사용량: 프롬프트={usage.get('prompt_tokens', 0)}, "
                f"완성={usage.get('completion_tokens', 0)}, 총합={usage.get('total_tokens', 0)}"
            )

        logger.info("\n" + "\n".join(lines))

    except Exception as e:
        logger.warning("⚠️ 로그 요약 중 오류: %s", e)


def run_worker():
    consumer = make_consumer([KAFKA_IN], group_id="llm-worker")
    producer = make_producer()
    logger.info("🚀 llm-worker started (IN=%s, OUT_DELTA=%s, OUT_DONE=%s)", KAFKA_IN, KAFKA_OUT_DELTA, KAFKA_OUT_DONE)

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            logger.debug("⏳ no message polled")
            continue
        if msg.error():
            logger.error("❌ Kafka 오류: %s", msg.error())
            continue

        try:
            logger.debug("📩 Raw Kafka message: %s", msg.value())
            ev = json.loads(msg.value().decode("utf-8"))
            logger.info("📥 Kafka 메시지 디코딩 성공: %s", ev)
        except Exception as e:
            logger.error("❌ Kafka 메시지 디코딩 실패: %s", e)
            continue

        headers_dict = read_headers(msg)
        tp = extract_traceparent(headers_dict)
        logger.debug("traceparent=%s", tp)

        decision = ev.get("decision") or {}
        action = decision.get("action") or ev.get("action")
        logger.debug("decision=%s, action=%s", decision, action)
        if action != "PASS":
            logger.info("⏩ PASS가 아닌 메시지 건너뜀 (action=%s)", action)
            continue

        trace_id = ev.get("trace_id")
        chat_room_id = ev.get("room_id")
        message_id = ev.get("message_id")
        user_id = ev.get("user_id")
        user_id = int(user_id) if user_id is not None else None

        logger.debug("▶️ trace_id=%s, room_id=%s, message_id=%s, user_id=%s", trace_id, chat_room_id, message_id, user_id)

        # 입력 텍스트 확보
        user_input = ev.get("cleaned_text") or ev.get("original_text") or ""
        logger.debug("user_input=%s", user_input)

        try:
            with get_session() as session:
                # 1) system_prompt
                system_prompt = prompt_builder_service.build_system_prompt(session, user_id)
                system_prompt += "\n\n답변은 반드시 마크다운 형식으로 작성하세요."
                logger.debug("system_prompt=%s", system_prompt)

                # 2) 최근 대화 맥락
                context_snippets = [
                    f"{m['role']}: {m['content']}"
                    for m in prompt_builder_service.get_recent_conversation(chat_room_id, limit=10)
                ]
                logger.debug("context_snippets=%s", context_snippets)

                # 3) ES embedding 기반 검색
                similar_contexts = prompt_builder_service.search_similar_context_es(
                    query=user_input, user_id=user_id, top_k=3, min_score=0.7
                )
                logger.debug("similar_contexts=%s", similar_contexts)

                # 4) full_prompt 조립
                full_prompt = (
                    f"System: {system_prompt}\n\n"
                    + "\n".join(context_snippets)
                    + ("\n\n[과거 유사 맥락]\n" + "\n".join(similar_contexts) if similar_contexts else "")
                    + (f"\n\n유저: {user_input}" if user_input else "")
                )
                logger.debug("full_prompt=%s", full_prompt)

                # 5) PromptBuilt 저장
                pb = PromptBuilt(
                    trace_id=trace_id,
                    built_prompt=full_prompt,
                    context_messages=context_snippets,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(pb)
                session.commit()
                logger.debug("PromptBuilt 저장 완료")

        except Exception as e:
            logger.exception("❌ PROMPT_BUILD_ERROR")
            error_service.save_error(trace_id=trace_id, error_type="PROMPT_BUILD_ERROR", error=e)
            continue

        start = time.time()
        model_name = os.getenv("LLM_MODEL", "gpt-4.1-nano")
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        logger.info("🤖 LLM 호출 준비: model=%s, temperature=%s", model_name, temperature)

        chunks = []
        try:
            for event in llm_client.call_llm(full_prompt, stream=True, model=model_name, temperature=temperature):
                logger.info(f"LLM Raw Event: {event}")
                if event["type"] == "delta":
                    delta = event["delta"]
                    chunks.append(delta)
                    logger.debug("delta=%s", delta)

                    try:
                        payload = {
                            "trace_id": trace_id,
                            "room_id": chat_room_id,
                            "message_id": message_id,
                            "delta": delta,
                            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                        }
                        logger.debug("📤 Publish DELTA payload=%s", payload)
                        publish(
                            producer,
                            KAFKA_OUT_DELTA,
                            key=chat_room_id,
                            value=payload,
                            headers=[("traceparent", tp.encode())] if tp else None,
                        )
                    except Exception as e:
                        logger.exception("🔥 LLM 스트리밍 중 오류 발생")
                        error_service.save_error(trace_id, "KAFKA_DELTA_ERROR", e)

                elif event["type"] == "done":
                    usage = event["usage"]
                    latency_ms = int((time.time() - start) * 1000)
                    full_text = "".join(chunks)

                    log_llm_process(user_input, system_prompt, context_snippets, similar_contexts, full_text, usage)

                    # TokenUsage 저장
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
                            logger.debug("TokenUsage 저장 완료")
                    except Exception as e:
                        logger.exception("❌ DB_INSERT_ERROR (TokenUsage)")
                        error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                    # Redis Append (user + assistant 대화 저장)
                    try:
                        append_conversation(room_id=chat_room_id, role="user", content=user_input)
                        append_conversation(room_id=chat_room_id, role="assistant", content=full_text)
                        logger.debug("Redis Append 완료")
                    except Exception as e:
                        logger.exception("❌ REDIS_APPEND_ERROR")
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
                                logger.debug("RoomSummaryState 업데이트 완료")
                    except Exception as e:
                        logger.exception("❌ DB_UPDATE_ERROR (RoomSummaryState)")
                        error_service.save_error(trace_id, "DB_UPDATE_ERROR", e)

                    # Kafka DONE 발행
                    try:
                        payload = {
                            "trace_id": trace_id,
                            "room_id": chat_room_id,
                            "message_id": message_id,
                            "response": {"text": full_text},
                            "usage": usage,
                            "latency_ms": latency_ms,
                            "schema_version": "1.0.0",
                            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                        }
                        logger.debug("📤 Publish DONE payload=%s", payload)
                        publish(
                            producer,
                            KAFKA_OUT_DONE,
                            key=chat_room_id,
                            value=payload,
                            headers=[("traceparent", tp.encode())] if tp else None,
                        )

                        done_at = int(datetime.now(timezone.utc).timestamp() * 1000)
                        produced_at = int(ev.get("timestamp", done_at))
                        total_pipeline_ms = done_at - produced_at
                        logger.info("\n" + f"🏁 전체 파이프라인 처리 시간 (LLM DONE): {total_pipeline_ms}ms")

                    except Exception as e:
                        logger.exception("❌ KAFKA_DONE_ERROR")
                        error_service.save_error(trace_id, "KAFKA_DONE_ERROR", e)

        except Exception as e:
            logger.exception("❌ LLM_CALL_ERROR")
            error_service.save_error(trace_id, "LLM_CALL_ERROR", e)


if __name__ == "__main__":
    run_worker()
