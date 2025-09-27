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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("llm-worker")

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_LLM", "chat.filter.result.v1")
KAFKA_OUT_DELTA = os.getenv("KAFKA_TOPIC_OUT_LLM_DELTA", "chat.llm.answer.delta.v1")
KAFKA_OUT_DONE = os.getenv("KAFKA_TOPIC_OUT_LLM_DONE", "chat.llm.answer.done.v1")


def log_llm_process(user_input: str, system_prompt: str, context_snippets: list,
                    similar_contexts: list, full_text: str = None, usage: dict = None):
    try:
        lines = []
        lines.append("🤖 [LLM 처리 과정 요약]")
        lines.append(f"  📝 유저 입력: \"{user_input}\"")

        if system_prompt:
            lines.append("  ⚙️ 시스템 프롬프트:")
            for sp_line in system_prompt.splitlines()[:5]:  # 너무 길면 앞부분만
                lines.append(f"    {sp_line}")
            if len(system_prompt.splitlines()) > 5:
                lines.append("    ...")

        if context_snippets:
            lines.append("  💬 최근 대화 맥락:")
            for i, ctx in enumerate(context_snippets[-5:], 1):  # 최근 5개만
                lines.append(f"    {i}) {ctx}")
        else:
            lines.append("  💬 최근 대화 맥락 없음")

        if similar_contexts:
            lines.append("  🔍 유사 맥락(ES):")
            for i, ctx in enumerate(similar_contexts, 1):
                lines.append(f"    {i}) {ctx}")
        else:
            lines.append("  🔍 유사 맥락 없음")

        if full_text is not None:
            preview = full_text[:100] + ("..." if len(full_text) > 100 else "")
            lines.append(f"  ✅ LLM 최종 답변: {preview}")

        if usage:
            lines.append(f"  📊 토큰 사용량: prompt={usage.get('prompt_tokens', 0)}, "
                         f"completion={usage.get('completion_tokens', 0)}, total={usage.get('total_tokens', 0)}")

        logger.info("\n" + "\n".join(lines))

    except Exception as e:
        logger.warning("⚠️ 요약 로그 출력 중 오류: %s", e)


def run_worker():
    #logger.info("🚀 LLM 워커 시작 (구독 토픽=%s)", KAFKA_IN)
    consumer = make_consumer([KAFKA_IN], group_id="llm-worker")
    producer = make_producer()
    #logger.info("✅ Kafka 연결 준비 완료")

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            logger.error("❌ Kafka 에러 발생: %s", msg.error())
            continue

        try:
            ev = json.loads(msg.value().decode("utf-8"))
            #logger.info("📩 Kafka 이벤트 수신: %s", ev)
        except Exception as e:
            logger.exception("⚠️ Kafka 메시지 디코딩 실패")
            continue

        headers_dict = read_headers(msg)
        tp = extract_traceparent(headers_dict)

        decision = ev.get("decision") or {}
        action = decision.get("action") or ev.get("action")
        if action != "PASS":
            logger.info("⏩ PASS가 아닌 메시지 건너뜀 (action=%s)", action)
            continue

        trace_id = ev.get("trace_id")
        chat_room_id = ev.get("room_id")
        message_id = ev.get("message_id")
        user_id = ev.get("user_id")
        user_id = int(user_id) if user_id is not None else None

        user_input = ev.get("cleaned_text") or ev.get("original_text") or ""
        #logger.info("➡️ 처리 시작 (trace_id=%s, room_id=%s)", trace_id, chat_room_id)

        # -------------------
        # 프롬프트 빌드
        # -------------------
        system_prompt = ""
        context_snippets = []
        similar_contexts = []
        try:
            with get_session() as session:
                logger.info("⚙️ 프롬프트 빌드 (user_id=%s)", user_id)

                system_prompt = prompt_builder_service.build_system_prompt(session, user_id)
                system_prompt += "\n\n답변은 반드시 마크다운 형식으로 작성하세요."

                context_snippets = [
                    f"{m['role']}: {m['content']}"
                    for m in prompt_builder_service.get_recent_conversation(chat_room_id, limit=10)
                ]
                logger.info("💬 최근 대화 맥락 %d개", len(context_snippets))

                similar_contexts = prompt_builder_service.search_similar_context_es(
                    query=user_input, user_id=user_id, top_k=3, min_score=0.7
                )
                logger.info("🔍 유사 맥락 %d개", len(similar_contexts) if similar_contexts else 0)

                full_prompt = (
                    f"System: {system_prompt}\n\n"
                    + "\n".join(context_snippets)
                    + ("\n\n[과거 유사 맥락]\n" + "\n".join(similar_contexts) if similar_contexts else "")
                    + (f"\n\n유저: {user_input}" if user_input else "")
                )

                pb = PromptBuilt(
                    trace_id=trace_id,
                    built_prompt=full_prompt,
                    context_messages=context_snippets,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(pb)
                session.commit()
                logger.info("💾 PromptBuilt 저장 완료 (trace_id=%s)", trace_id)

        except Exception as e:
            logger.exception("❌ 프롬프트 빌드 실패")
            error_service.save_error(trace_id=trace_id, error_type="PROMPT_BUILD_ERROR", error=e)
            continue


        start = time.time()
        model_name = os.getenv("LLM_MODEL", "gpt-4.1-nano")
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        #logger.info("🤖 LLM 호출 (model=%s, temperature=%.2f)", model_name, temperature)

        chunks = []
        try:
            for event in llm_client.call_llm(full_prompt, stream=True, model=model_name, temperature=temperature):
                if event["type"] == "delta":
                    delta = event["delta"]
                    chunks.append(delta)

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
                    except Exception as e:
                        logger.exception("❌ 델타 이벤트 발행 실패")
                        error_service.save_error(trace_id, "KAFKA_DELTA_ERROR", e)

                elif event["type"] == "done":
                    usage = event["usage"]
                    latency_ms = int((time.time() - start) * 1000)
                    full_text = "".join(chunks)
                    logger.info("✅ LLM 응답 완료 (지연=%dms, 토큰=%s)", latency_ms, usage)

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
                        #logger.info("💾 TokenUsage 저장 완료")
                    except Exception as e:
                        logger.exception("❌ TokenUsage 저장 실패")
                        error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                    # Redis Append
                    try:
                        append_conversation(room_id=chat_room_id, role="user", content=user_input)
                        append_conversation(room_id=chat_room_id, role="assistant", content=full_text)
                        #logger.info("💾 Redis 대화 저장 완료")
                    except Exception as e:
                        logger.exception("❌ Redis 저장 실패")
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
                        #logger.info("🔄 unsummarized_count 갱신 완료")
                    except Exception as e:
                        logger.exception("❌ RoomSummaryState 갱신 실패")
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
                        #logger.info("📡 DONE 이벤트 발행 완료 (토픽=%s)", KAFKA_OUT_DONE)
                    except Exception as e:
                        logger.exception("❌ DONE 이벤트 발행 실패")
                        error_service.save_error(trace_id, "KAFKA_DONE_ERROR", e)

                    # 👉 요약 로그 블록 출력
                    log_llm_process(
                        user_input=user_input,
                        system_prompt=system_prompt,
                        context_snippets=context_snippets,
                        similar_contexts=similar_contexts,
                        full_text=full_text,
                        usage=usage,
                    )

        except Exception as e:
            logger.exception("❌ LLM 호출 실패")
            error_service.save_error(trace_id, "LLM_CALL_ERROR", e)


if __name__ == "__main__":
    run_worker()
