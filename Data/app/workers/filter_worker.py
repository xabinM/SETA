import os
import json
from datetime import datetime, timezone
import tiktoken

from app.adapters.kafka_io import make_consumer, make_producer, publish, read_headers
from app.utils.tracing import extract_traceparent
from app.pipelines.filter.filter_pipeline import filter_pipeline
from app.adapters.db import get_session
from app.models import FilterResult, TokenUsage
from app.adapters.es import get_es_client

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_RAW", "chat.raw.request.v1")
KAFKA_OUT_FILTER = os.getenv("KAFKA_TOPIC_FILTER_RESULT", "chat.filter.result.v1")


def estimate_tokens(text: str) -> int:
    """
    tiktoken 기반 토큰 추정치 계산
    """
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        return 0


def run_filter_worker():
    consumer = make_consumer([KAFKA_IN], group_id="filter-worker")
    producer = make_producer()
    es = get_es_client()

    while True:
        msg = consumer.poll(1.0)
        if msg is None or msg.error():
            continue

        # === traceparent 추출 ===
        headers_dict = read_headers(msg)
        tp = extract_traceparent(headers_dict)

        try:
            ev = json.loads(msg.value().decode("utf-8"))
        except Exception:
            continue

        trace_id = ev.get("trace_id")
        room_id = ev.get("room_id") or (msg.key().decode() if msg.key() else None)
        user_id = ev.get("user_id")
        text = ev.get("text", "")
        final_text = ev.get("final_text", "")
        mode = ev.get("mode", "auto")
        top_category = ev.get("top_category", "")

        if mode == "auto":
            # ===== AUTO 모드 =====
            token_count = estimate_tokens(text)

            try:
                with get_session() as session:
                    fr = FilterResult(
                        trace_id=trace_id,
                        room_id=room_id,
                        user_id=user_id,
                        rule_name="auto",
                        created_at=datetime.now(timezone.utc),
                    )
                    session.add(fr)

                    tu = TokenUsage(
                        trace_id=trace_id,
                        prompt_tokens=token_count,
                        completion_tokens=0,
                        total_tokens=token_count,
                        created_at=datetime.now(timezone.utc),
                    )
                    session.add(tu)
                    session.commit()
            except Exception as e:
                print("DB insert error (auto):", e)

            # ES 기록
            try:
                es.index(
                    index="filter-logs",
                    body={
                        "trace_id": trace_id,
                        "user_id": user_id,
                        "reason_type": top_category or "auto",
                        "dropped_text": text,
                        "created_at": datetime.utcnow(),
                    },
                )
            except Exception as e:
                print("ES index error (auto):", e)

            # Kafka 발행
            publish(
                producer,
                KAFKA_OUT_FILTER,
                key=room_id,
                value={
                    "trace_id": trace_id,
                    "room_id": room_id,
                    "user_id": user_id,
                    "rule": "auto",
                    "text": text,
                    "token_usage_estimate": {"input_tokens": token_count},
                },
                headers=[("traceparent", tp.encode())] if tp else None,
            )

        else:
            # ===== PASS 모드 =====
            decision = filter_pipeline(final_text or text)

            if decision["status"] == "drop":
                dropped_logs = decision.get("drop_logs", [])
                token_count = estimate_tokens(text)

                # DB 저장
                try:
                    with get_session() as session:
                        fr = FilterResult(
                            trace_id=trace_id,
                            room_id=room_id,
                            user_id=user_id,
                            rule_name="ml",
                            created_at=datetime.now(timezone.utc),
                        )
                        session.add(fr)

                        tu = TokenUsage(
                            trace_id=trace_id,
                            prompt_tokens=token_count,
                            completion_tokens=0,
                            total_tokens=token_count,
                            created_at=datetime.now(timezone.utc),
                        )
                        session.add(tu)
                        session.commit()
                except Exception as e:
                    print("DB insert error (pass/drop):", e)

                # ES 기록 (드랍된 텍스트 각각 저장)
                try:
                    for dropped in dropped_logs:
                        es.index(
                            index="filter-logs",
                            body={
                                "trace_id": trace_id,
                                "user_id": user_id,
                                "reason_type": decision.get("label", "ml"),
                                "dropped_text": dropped,
                                "created_at": datetime.utcnow(),
                            },
                        )
                except Exception as e:
                    print("ES index error (pass/drop):", e)

                # Kafka 발행
                publish(
                    producer,
                    KAFKA_OUT_FILTER,
                    key=room_id,
                    value={
                        "trace_id": trace_id,
                        "room_id": room_id,
                        "user_id": user_id,
                        "rule": "ml",
                        "text": text,
                        "drop_logs": dropped_logs,
                        "token_usage_estimate": {"input_tokens": token_count},
                    },
                    headers=[("traceparent", tp.encode())] if tp else None,
                )

            else:
                # PASS → Kafka 발행하지 않음
                continue
