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
    """LLM 처리 과정 한국어 요약 로그"""
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

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            continue  # 불필요한 영어 로그 대신 skip

        try:
            ev = json.loads(msg.value().decode("utf-8"))
        except Exception:
            continue

        headers_dict = read_headers(msg)
        tp = extract_traceparent(headers_dict)

        decision = ev.get("decision") or {}
        action = decision.get("action") or ev.get("action")
        if action != "PASS":
            logger.info("\n" + f"⏩ PASS가 아닌 메시지 건너뜀")
            continue  # PASS가 아닌 경우는 처리 안 함

        trace_id = ev.get("trace_id")
        chat_room_id = ev.get("room_id")
        message_id = ev.get("message_id")
        user_id = ev.get("user_id")
        user_id = int(user_id) if user_id is not None else None

        # 입력 텍스트 확보
        user_input = ev.get("cleaned_text") or ev.get("original_text") or ""

        try:
            with get_session() as session:
                # 1) system_prompt
                system_prompt = prompt_builder_service.build_system_prompt(session, user_id)
                system_prompt += "\n\n답변은 반드시 마크다운 형식으로 작성하세요."

                # 2) 최근 대화 맥락
                context_snippets = [
                    f"{m['role']}: {m['content']}"
                    for m in prompt_builder_service.get_recent_conversation(chat_room_id, limit=10)
                ]

                # 3) ES embedding 기반 검색
                similar_contexts = prompt_builder_service.search_similar_context_es(
                    query=user_input, user_id=user_id, top_k=3, min_score=0.7
                )

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

        except Exception as e:
            error_service.save_error(trace_id=trace_id, error_type="PROMPT_BUILD_ERROR", error=e)
            continue

        # === LLM 호출 ===
        start = time.time()
        model_name = os.getenv("LLM_MODEL", "gpt-4.1-nano")
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))

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
                        error_service.save_error(trace_id, "KAFKA_DELTA_ERROR", e)

                elif event["type"] == "done":
                    usage = event["usage"]
                    latency_ms = int((time.time() - start) * 1000)
                    full_text = "".join(chunks)

                    # 한국어 요약 로그 출력
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
                    except Exception as e:
                        error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                    # Redis Append (user + assistant 대화 저장)
                    try:
                        append_conversation(room_id=chat_room_id, role="user", content=user_input)
                        append_conversation(room_id=chat_room_id, role="assistant", content=full_text)
                    except Exception as e:
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
                    except Exception as e:
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
                    except Exception as e:
                        error_service.save_error(trace_id, "KAFKA_DONE_ERROR", e)

        except Exception as e:
            error_service.save_error(trace_id, "LLM_CALL_ERROR", e)


if __name__ == "__main__":
    run_worker()
