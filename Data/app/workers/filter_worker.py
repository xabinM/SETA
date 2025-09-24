import os
import json
import logging
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

# ------------------
# Logging 설정
# ------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("filter-worker")

FILTER_MODEL_PATH = os.getenv("FILTER_MODEL_PATH", "/app/models/filter")

logger.info("📦 Loading filter model from %s", FILTER_MODEL_PATH)
tokenizer = AutoTokenizer.from_pretrained(FILTER_MODEL_PATH, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(FILTER_MODEL_PATH, local_files_only=True)
logger.info("✅ Model loaded successfully")

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_RAW", "chat.raw.request.v1")
KAFKA_OUT_FILTER = os.getenv("KAFKA_TOPIC_FILTER_RESULT", "chat.filter.result.v1")

KST = timezone(timedelta(hours=9))


def estimate_tokens(text: str) -> int:
    """tiktoken 기반 토큰 추정치 계산"""
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception as e:
        logger.warning("⚠️ Token estimation failed: %s", e)
        return 0


def run_filter_worker():
    logger.info("🚀 Starting filter worker. Subscribing to %s", KAFKA_IN)
    consumer = make_consumer([KAFKA_IN], group_id="filter-worker")
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
            logger.info("📩 Received message: %s", ev)
        except Exception as e:
            logger.error("❌ Failed to decode message: %s", e)
            continue

        trace_id = ev.get("trace_id")
        room_id = ev.get("room_id") or (msg.key().decode() if msg.key() else None)
        message_id = ev.get("message_id")
        user_id = ev.get("user_id")
        text = ev.get("text", "")
        final_text = ev.get("final_text", "")
        mode = ev.get("mode", "auto")

        now_utc = datetime.now(timezone.utc)
        logger.info("➡️ Processing trace_id=%s, mode=%s", trace_id, mode)

        # === AUTO 모드 ===
        if mode == "auto":
            logger.info("⚙️ Auto mode → filler_removal pipeline")
            token_count = estimate_tokens(text)

            try:
                with get_session() as session:
                    fr = FilterResult(
                        trace_id=trace_id,
                        chat_room_id=room_id,
                        message_id=message_id,
                        user_id=user_id,
                        rule_name="rule",
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
                logger.info("💾 Saved FilterResult & TokenUsage (AUTO)")
            except Exception as e:
                logger.exception("❌ Failed DB insert (AUTO)")
                error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

            try:
                raw = type("RawObj", (), ev)()
                decision = type("Decision", (), {})()
                filter_service.save_to_es(raw, decision)
                logger.info("📤 Saved to Elasticsearch (AUTO)")
            except Exception as e:
                logger.exception("❌ Failed ES save (AUTO)")
                error_service.save_error(trace_id, "ES_SAVE_ERROR", e)

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
                headers=[("traceparent", trace_id.encode())] if trace_id else None,
            )
            logger.info("📡 Published filler_removal → %s", KAFKA_OUT_FILTER)

        # === PASS 모드 ===
        else:
            logger.info("⚙️ Pass mode → intent_classifier")
            decision = filter_classifier(final_text or text, model, tokenizer)
            logger.info("🤖 Classifier decision: %s", decision)
            token_count = estimate_tokens(text)

            if decision["status"] == "drop":
                try:
                    with get_session() as session:
                        fr = FilterResult(
                            trace_id=trace_id,
                            room_id=room_id,
                            message_id=message_id,
                            user_id=user_id,
                            rule_name="ml",
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
                    logger.info("💾 Saved FilterResult & TokenUsage (PASS)")
                except Exception as e:
                    logger.exception("❌ Failed DB insert (PASS)")
                    error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                try:
                    raw = type("RawObj", (), ev)()
                    filter_service.save_to_es(raw, decision)
                    logger.info("📤 Saved to Elasticsearch (PASS)")
                except Exception as e:
                    logger.exception("❌ Failed ES save (PASS)")
                    error_service.save_error(trace_id, "ES_SAVE_ERROR", e)

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
                    headers=[("traceparent", trace_id.encode())] if trace_id else None,
                )
                logger.info("📡 Published intent_classifier → %s", KAFKA_OUT_FILTER)
            else:
                logger.info("⏩ Decision=PASS, skipping insert/publish")

if __name__ == "__main__":
    run_filter_worker()
