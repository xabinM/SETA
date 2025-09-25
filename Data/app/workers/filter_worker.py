import os
import json
import logging
from datetime import datetime, timezone, timedelta
import tiktoken
from app.services import error_service, filter_service
from app.adapters.kafka_io import make_consumer, make_producer, publish
from app.pipelines.filter.filter_classifier import filter_classifier
from app.adapters.db import get_session
from app.models import FilterResult, TokenUsage
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.contracts.raw_filtered import RawFilteredMessage
from app.utils.usage import estimate_usage_by_tokens  # ✅ 추가

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

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_RAW", "chat.raw.filtered.v1")
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
        user_id = int(user_id) if user_id is not None else None
        text = ev.get("text", "")
        final_text = ev.get("final_text", "")
        mode = ev.get("mode", "pass")
        top_category = ev.get("top_category", "no_meaning")
        now_utc = datetime.now(timezone.utc)
        logger.info("➡️ Processing trace_id=%s, mode=%s", trace_id, mode)

        # === AUTO 모드 ===
        if mode == "auto":
            logger.info("⚙️ Auto mode → filler_removal pipeline")
            token_count = estimate_tokens(text)

            # 🔹 절약량 계산
            saved_cost, saved_energy, saved_co2, _ = estimate_usage_by_tokens(token_count)

            try:
                with get_session() as session:
                    fr = FilterResult(
                        trace_id=trace_id,
                        chat_room_id=room_id,
                        message_id=message_id,
                        stage="rule",
                        action="DROP",
                        rule_name=top_category,
                        created_at=now_utc,
                    )
                    session.add(fr)

                    tu = TokenUsage(
                        message_id=message_id,
                        user_id=user_id,
                        prompt_tokens=token_count,
                        completion_tokens=0,
                        total_tokens=token_count,
                        cost_usd=None,
                        energy_wh=None,
                        co2_g=None,
                        saved_tokens=token_count,
                        saved_cost_usd=saved_cost,
                        saved_energy_wh=saved_energy,
                        saved_co2_g=saved_co2,
                        created_at=now_utc,
                    )
                    session.add(tu)
                    session.commit()
                logger.info("💾 Saved FilterResult & TokenUsage (AUTO)")
            except Exception as e:
                logger.exception("❌ Failed DB insert (AUTO)")
                error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

            # ES 저장
            try:
                raw = type("RawObj", (), ev)()
                auto_logs = ev.get("filtered_words_details", [[], []])[0]
                es_decision = {
                    "action": "DROP",
                    "cleaned_text": "",
                    "original_text": text,
                    "drop_logs": auto_logs,
                    "reason_type": top_category,
                    "explanations": [],
                }
                filter_service.save_to_es(raw, es_decision)
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
                    "cleaned_text": "",
                    "detected_phrases": ev.get("filtered_words_details", [[], []])[0],
                    "decision": {"action": "DROP",
                                 "reason_type": top_category
                                 },
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

            status = decision["status"] if isinstance(decision, dict) else getattr(decision, "action", None)

            if status == "drop":
                original_tokens = estimate_tokens(text)
                saved_cost, saved_energy, saved_co2, _ = estimate_usage_by_tokens(original_tokens)

                raw = RawFilteredMessage(
                    trace_id=trace_id,
                    room_id=room_id,
                    message_id=message_id,
                    user_id=user_id,
                    text=text,
                    final_text= "",
                    timestamp=ev.get("timestamp"),
                    schema_version=ev.get("schema_version", "1.0.0"),
                )
                filter_service.save_filter_results(raw, decision, rule_name="no_meaning")

                # TokenUsage 저장
                try:
                    with get_session() as session:
                        tu = TokenUsage(
                            message_id=message_id,
                            user_id=user_id,
                            prompt_tokens=original_tokens,
                            completion_tokens=0,
                            total_tokens=original_tokens,
                            cost_usd=0,
                            energy_wh=0,
                            co2_g=0,
                            saved_tokens=original_tokens,
                            saved_cost_usd=saved_cost,
                            saved_energy_wh=saved_energy,
                            saved_co2_g=saved_co2,
                            created_at=now_utc,
                        )
                        session.add(tu)
                        session.commit()
                    logger.info("💾 TokenUsage saved (ML DROP)")
                except Exception as e:
                    logger.exception("❌ Failed DB insert (ML DROP)")
                    error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                try:
                    filter_service.save_to_es(raw, decision)
                except Exception as e:
                    logger.exception("❌ Failed ES save (ML DROP)")
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
                            "action": "DROP",
                            "score": decision.get("score"),
                            "threshold": decision.get("threshold"),
                            "reason_type": decision.get("label"),
                            "reason_text": decision.get("reason_text"),
                        },
                        "explanations": decision.get("explanations", []),
                        "schema_version": "1.0.0",
                    },
                )
                logger.info("📡 Published intent_classifier DROP → %s", KAFKA_OUT_FILTER)

            else:
                # === ML PASS ===
                raw = RawFilteredMessage(
                    trace_id=trace_id,
                    room_id=room_id,
                    message_id=message_id,
                    user_id=user_id,
                    text=text,
                    final_text= decision.get("content") or "",
                    timestamp=ev.get("timestamp"),
                    schema_version=ev.get("schema_version", "1.0.0"),
                )

                # 토큰 계산
                original_tokens = estimate_tokens(text)
                cleaned_text = decision.get("content") or (final_text or text)
                cleaned_tokens = estimate_tokens(cleaned_text)
                saved_tokens = max(0, original_tokens - cleaned_tokens)

                # 실제 사용량
                cost_usd, energy_wh, co2_g, _ = estimate_usage_by_tokens(cleaned_tokens)
                # 절약량
                saved_cost, saved_energy, saved_co2, _ = estimate_usage_by_tokens(saved_tokens)

                # drop_logs 있으면 DB 기록
                if getattr(decision, "drop_logs", None) or decision.get("drop_logs"):
                    filter_service.save_filter_results(raw, decision, rule_name="mo_meaning")

                # TokenUsage 저장
                try:
                    with get_session() as session:
                        tu = TokenUsage(
                            message_id=message_id,
                            user_id=user_id,
                            prompt_tokens=cleaned_tokens,
                            completion_tokens=0,
                            total_tokens=cleaned_tokens,
                            cost_usd=cost_usd,
                            energy_wh=energy_wh,
                            co2_g=co2_g,
                            saved_tokens=saved_tokens,
                            saved_cost_usd=saved_cost,
                            saved_energy_wh=saved_energy,
                            saved_co2_g=saved_co2,
                            created_at=now_utc,
                        )
                        session.add(tu)
                        session.commit()
                    logger.info("💾 TokenUsage saved (ML PASS)")
                except Exception as e:
                    logger.exception("❌ Failed DB insert (ML PASS)")
                    error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                try:
                    filter_service.save_to_es(raw, decision)
                except Exception as e:
                    logger.exception("❌ Failed ES save (ML PASS)")
                    error_service.save_error(trace_id, "ES_SAVE_ERROR", e)

                publish(
                    producer,
                    KAFKA_OUT_FILTER,
                    key=room_id,
                    value={
                        "trace_id": trace_id,
                        "room_id": room_id,
                        "user_id": user_id,
                        "message_id": message_id,
                        "stage": "intent_classifier",
                        "stage_order": 2,
                        "timestamp": int(datetime.now().timestamp() * 1000),
                        "original_text": text,
                        "cleaned_text": decision.get("content") or text,
                        "decision": {
                            "action": "PASS",
                            "score": decision.get("score"),
                            "threshold": decision.get("threshold"),
                            "reason_type": decision.get("label"),
                            "reason_text": decision.get("reason_text"),
                        },
                        "explanations": decision.get("explanations", []),
                        "schema_version": "1.0.0",
                    },
                )
                logger.info("📡 Published intent_classifier PASS → %s", KAFKA_OUT_FILTER)


if __name__ == "__main__":
    run_filter_worker()
