import os
import time
from datetime import datetime, timezone
import traceback

from app.models import RoomSummaryState, PromptBuilt, TokenUsage
from app.adapters.kafka_io import make_consumer, make_producer, publish, read_headers
from app.utils.trace import extract_traceparent
from app.adapters.db import get_session
from app.services import prompt_builder_service, llm_client, error_service
from app.adapters.redis_io import append_conversation


KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_LLM", "chat.filter.result.v1")
KAFKA_OUT_DELTA = os.getenv("KAFKA_TOPIC_OUT_LLM_DELTA", "chat.llm.answer.delta.v1")
KAFKA_OUT_DONE = os.getenv("KAFKA_TOPIC_OUT_LLM_DONE", "chat.llm.answer.done.v1")


def run_worker():
    consumer = make_consumer([KAFKA_IN], group_id="llm-worker")
    producer = make_producer()

    for msg in consumer:
        headers_dict = read_headers(msg)
        tp = extract_traceparent(headers_dict)

        data = msg.value()
        if not data:
            continue

        rule = data.get("rule")
        if rule not in ("ml-pass", "auto"):
            continue  # drop은 무시

        trace_id = data["trace_id"]
        room_id = data["room_id"]
        message_id = data.get("message_id")
        user_id = data.get("user_id")
        user_input = data.get("text") or ""

        try:
            with get_session() as session:
                # 1) system_prompt (마크다운 고정)
                system_prompt = prompt_builder_service.build_system_prompt(session, user_id)
                system_prompt += "\n\n답변은 반드시 마크다운 형식으로 작성하세요."

                # 2) 최근 대화 맥락
                context_snippets = prompt_builder_service.get_context(session, room_id)

                # 3) ES embedding 기반 유사 검색
                similar_contexts = prompt_builder_service.search_user_memory_embedding(
                    query=user_input,
                    top_k=3,
                    score_threshold=0.7,
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
            error_service.save_error(
                trace_id=trace_id,
                error_type="PROMPT_BUILD_ERROR",
                error=e,
            )
            continue

        # === LLM 스트리밍 호출 ===
        start = time.time()
        model_name = os.getenv("LLM_MODEL", "gpt-4o")
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))

        chunks = []
        try:
            for event in llm_client.chat_completion(model_name, full_prompt, temperature):
                if event["type"] == "delta":
                    delta = event["delta"]
                    chunks.append(delta)

                    try:
                        publish(
                            producer,
                            KAFKA_OUT_DELTA,
                            key=room_id,
                            value={
                                "trace_id": trace_id,
                                "room_id": room_id,
                                "message_id": message_id,
                                "delta": delta,
                                "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                            },
                            headers=[("traceparent", tp.encode())] if tp else None,
                        )
                    except Exception as e:
                        error_service.save_error(
                            trace_id=trace_id,
                            error_type="KAFKA_DELTA_ERROR",
                            error=e,
                        )

                elif event["type"] == "done":
                    usage = event["usage"]
                    latency_ms = int((time.time() - start) * 1000)
                    full_text = "".join(chunks)

                    # === TokenUsage 저장 ===
                    try:
                        with get_session() as session:
                            token_usage = TokenUsage(
                                message_id=message_id,
                                prompt_tokens=usage["prompt_tokens"],
                                completion_tokens=usage["completion_tokens"],
                                total_tokens=usage["total_tokens"],
                                cost_usd=usage["cost_usd"],
                                energy_wh=usage["energy_wh"],
                                co2_g=usage["co2_g"],
                                saved_tokens=usage.get("saved_tokens", 0),
                                saved_cost_usd=usage.get("saved_cost_usd", 0),
                                saved_energy_wh=usage.get("saved_energy_wh", 0),
                                saved_co2_g=usage.get("saved_co2_g", 0),
                                user_id=user_id,
                                created_at=datetime.now(timezone.utc),
                            )
                            session.add(token_usage)
                            session.commit()
                    except Exception as e:
                        error_service.save_error(
                            trace_id=trace_id,
                            error_type="DB_INSERT_ERROR",
                            error=e,
                        )

                    # === Redis Append ===
                    try:
                        append_conversation(
                            room_id=room_id,
                            user_input=user_input,
                            assistant_output=full_text,
                        )
                    except Exception as e:
                        error_service.save_error(
                            trace_id=trace_id,
                            error_type="REDIS_APPEND_ERROR",
                            error=e,
                        )

                    # === unsummarized_count 증가 ===
                    try:
                        with get_session() as session:
                            state = session.query(RoomSummaryState).filter_by(chat_room_id=room_id).first()
                            if state:
                                state.unsummarized_count = (state.unsummarized_count or 0) + 1
                                session.add(state)
                                session.commit()
                    except Exception as e:
                        error_service.save_error(
                            trace_id=trace_id,
                            error_type="DB_UPDATE_ERROR",
                            error=e,
                        )

                    # === Kafka DONE 발행 ===
                    try:
                        publish(
                            producer,
                            KAFKA_OUT_DONE,
                            key=room_id,
                            value={
                                "trace_id": trace_id,
                                "room_id": room_id,
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
                        error_service.save_error(
                            trace_id=trace_id,
                            error_type="KAFKA_DONE_ERROR",
                            error=e,
                        )

        except Exception as e:
            error_service.save_error(
                trace_id=trace_id,
                error_type="LLM_CALL_ERROR",
                error=e,
            )
