import os
import json
from datetime import datetime, timezone, timedelta
import tiktoken
from app.services import error_service
from app.adapters.kafka_io import make_consumer, make_producer, publish, read_headers
from app.utils.trace import extract_traceparent
from app.pipelines.filter.filter_classifier import filter_classifier
from app.adapters.db import get_session
from app.models import FilterResult, TokenUsage
from app.services import filter_service
from transformers import AutoTokenizer, AutoModelForSequenceClassification

FILTER_MODEL_PATH = os.getenv("FILTER_MODEL_PATH", "/app/models/filter")

tokenizer = AutoTokenizer.from_pretrained(FILTER_MODEL_PATH, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(FILTER_MODEL_PATH, local_files_only=True)


KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_RAW", "chat.raw.request.v1")
KAFKA_OUT_FILTER = os.getenv("KAFKA_TOPIC_FILTER_RESULT", "chat.filter.result.v1")

KST = timezone(timedelta(hours=9))


def estimate_tokens(text: str) -> int:
    """tiktoken 기반 토큰 추정치 계산"""
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        return 0


def run_filter_worker():
    consumer = make_consumer([KAFKA_IN], group_id="filter-worker")
    producer = make_producer()

    while True:
        msg = consumer.poll(1.0)
        if msg is None or msg.error():
            continue

        headers_dict = read_headers(msg)
        tp = extract_traceparent(headers_dict)

        try:
            ev = json.loads(msg.value().decode("utf-8"))
        except Exception:
            continue

        trace_id = ev.get("trace_id")
        room_id = ev.get("room_id") or (msg.key().decode() if msg.key() else None)
        message_id = ev.get("message_id")
        user_id = ev.get("user_id")
        text = ev.get("text", "")
        final_text = ev.get("final_text", "")
        mode = ev.get("mode", "auto")

        now_utc = datetime.now(timezone.utc)

        # === AUTO 모드 → filler_removal ===
        if mode == "auto":
            token_count = estimate_tokens(text)

            # ✅ DB 저장 (rule)
            try:
                with get_session() as session:
                    fr = FilterResult(
                        trace_id=trace_id,
                        room_id=room_id,
                        message_id=message_id,
                        user_id=user_id,
                        rule_name="rule",  # auto는 rule
                        created_at=now_utc,
                    )
                    session.add(fr)

                    tu = TokenUsage(
                        trace_id=trace_id,
                        prompt_tokens=token_count,
                        completion_tokens=0,
                        total_tokens=token_count,
                        created_at=now_utc,
                    )
                    session.add(tu)
                    session.commit()
            except Exception as e:
                 error_service.save_error(
                    trace_id=trace_id,
                    error_type="DB_INSERT_ERROR",
                    error=e,
                    )

            try:
                raw = type("RawObj", (), ev)()   # dict → 임시 객체
                decision = type("Decision", (), {})()  # auto는 decision 없음
                filter_service.save_to_es(raw, decision)
            except Exception as e:
                 error_service.save_error(
                    trace_id=trace_id,
                    error_type="ES_SAVE_ERROR",
                    error=e,
                    )    
            

            publish(
                producer,
                KAFKA_OUT_FILTER,
                key=room_id,
                value={
                    "trace_id": trace_id,
                    "room_id": room_id,
                    "message_id": message_id,
                    "stage": "filler_removal",
                    "stage_order": 1,
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    "original_text": text,
                    "cleaned_text": final_text or text,
                    "detected_phrases": ev.get("filtered_words_details", [[], []])[0],
                    "schema_version": "1.0.0",
                },
                headers=[("traceparent", tp.encode())] if tp else None,
            )

        # === PASS 모드 → intent_classifier ===
        else:
            decision = filter_classifier(final_text or text, model, tokenizer)
            token_count = estimate_tokens(text)

            if decision["status"] == "drop":
                try:
                    with get_session() as session:
                        fr = FilterResult(
                            trace_id=trace_id,
                            room_id=room_id,
                            message_id=message_id,
                            user_id=user_id,
                            rule_name="ml",  # 모델 실행은 ml
                            created_at=now_utc,
                        )
                        session.add(fr)

                        tu = TokenUsage(
                            trace_id=trace_id,
                            prompt_tokens=token_count,
                            completion_tokens=0,
                            total_tokens=token_count,
                            created_at=now_utc,
                        )
                        session.add(tu)
                        session.commit()
                except Exception as e:
                    error_service.save_error(
                    trace_id=trace_id,
                    error_type="DB_INSERT_ERROR",
                    error=e,
                    )

                try:
                    raw = type("RawObj", (), ev)()
                    filter_service.save_to_es(raw, decision)
                except Exception as e:
                    error_service.save_error(
                    trace_id=trace_id,
                    error_type="ES_SAVE_ERROR",
                    error=e,
                    )

                publish(
                    producer,
                    KAFKA_OUT_FILTER,
                    key=room_id,
                    value={
                        "trace_id": trace_id,
                        "room_id": room_id,
                        "message_id": message_id,
                        "stage": "intent_classifier",
                        "stage_order": 2,
                        "timestamp": int(datetime.now().timestamp() * 1000),
                        "original_text": text,
                        "cleaned_text": final_text or text,
                        "decision": {
                            "action": decision["status"].upper(),
                            "score": decision.get("score"),
                            "threshold": decision.get("threshold"),
                            "reason_type": decision.get("label"),
                            "reason_text": decision.get("reason_text"),
                        },
                        "explanations": decision.get("explanations", []),
                        "schema_version": "1.0.0",
                    },
                    headers=[("traceparent", tp.encode())] if tp else None,
                )
            else:
                continue
