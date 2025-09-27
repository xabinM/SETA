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
from app.utils.usage import estimate_usage_by_tokens

LABEL_MAP = {
    "goodbye": "🙇 작별",
    "apology": "🙏 사과",
    "thank": "🙏 감사",
    "greeting": "👋 인사",
    "call_only": "🎯 단순 호출",
    "reaction_only": "😮 감탄사",
    "no_meaning": "❌ 의미 없음",
    "connector_filler": "🔗 연결어",
    "meaningful": "✅ 정상 요청",
}


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("filter-worker")

# ES 내부 transport 로그 감추기
logging.getLogger("elastic_transport.transport").setLevel(logging.WARNING)

FILTER_MODEL_PATH = os.getenv("FILTER_MODEL_PATH", "/app/models/filter")

tokenizer = AutoTokenizer.from_pretrained(FILTER_MODEL_PATH, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(FILTER_MODEL_PATH, local_files_only=True)

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_RAW", "chat.raw.filtered.v1")
KAFKA_OUT_FILTER = os.getenv("KAFKA_TOPIC_FILTER_RESULT", "chat.filter.result.v1")

KST = timezone(timedelta(hours=9))



def log_filter_process(original_text: str, decision: dict, mode: str = "ml", filtered_words_details=None):
    try:
        lines = []
        lines.append("📑 [필터링 과정 요약]")
        lines.append(f"  📝 원문: \"{original_text}\"")

        if filtered_words_details:
            words = filtered_words_details[0] if len(filtered_words_details) > 0 else []
            labels = filtered_words_details[1] if len(filtered_words_details) > 1 else []
            if words and labels:
                lines.append("  📌 규칙 기반 필터링 결과")
                for w, l in zip(words, labels):
                    label_ko = LABEL_MAP.get(l, l)
                    lines.append(f'  - "{w}" → {label_ko} 이유로 필터링 됨')

        if mode == "rule":
            if filtered_words_details and words and labels:
                lines.append("  ❌ 최종 남은 문장 없음 (규칙 기반 DROP)")
            else:
                lines.append("  ⚪️ 규칙 기반 필터된 구간 없음")
                lines.append(f"  ✅ 최종 남은 문장: \"{original_text}\"")

        else:
            drop_logs = decision.get("drop_logs", [])
            kept = decision.get("kept_sentences", [])

            if drop_logs:
                lines.append("  📌 ML 기반 필터링 결과")
                for log in drop_logs:
                    part = log.get("text") or log.get("원문") or log.get("dropped_text")
                    label_en = log.get("label")
                    label_ko = LABEL_MAP.get(label_en, label_en)
                    lines.append(f'  - "{part}" → {label_ko} 이유로 필터링 됨')
            else:
                lines.append("  ⚪️ ML 기반 필터된 구간 없음")

            if kept:
                lines.append(f"  ✅ 최종 남은 문장: \"{' '.join(kept)}\"")
            else:
                lines.append("  ❌ 최종 남은 문장 없음 (전부 DROP)")

        logger.info("\n" + "\n".join(lines))

    except Exception as e:
        logger.warning("⚠️ 로그 요약 중 오류: %s", e)



def estimate_tokens(text: str) -> int:
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception as e:
        logger.warning("⚠️ 토큰 개수 추정 실패: %s", e)
        return 0


def run_filter_worker():
    consumer = make_consumer([KAFKA_IN], group_id="filter-worker")
    producer = make_producer()

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            logger.error("❌ Kafka 오류: %s", msg.error())
            continue

        try:
            ev = json.loads(msg.value().decode("utf-8"))
            # logger.info("📩 Kafka 메시지 수신: %s", ev)
        except Exception as e:
            logger.error("❌ Kafka 메시지 디코딩 실패: %s", e)
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

        if mode == "auto":
            token_count = estimate_tokens(text)
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
                        cost_usd=0,
                        energy_wh=0,
                        co2_g=0,
                        saved_tokens=token_count,
                        saved_cost_usd=saved_cost,
                        saved_energy_wh=saved_energy,
                        saved_co2_g=saved_co2,
                        created_at=now_utc,
                    )
                    session.add(tu)
                    session.commit()
            except Exception as e:
                error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

            try:
                raw = type("RawObj", (), ev)()
                details = ev.get("filtered_words_details", [[], []])
                words = details[0] if len(details) > 0 else []
                labels = details[1] if len(details) > 1 else []

                for w, l in zip(words, labels):
                    es_decision = {
                        "action": "DROP",
                        "cleaned_text": "",
                        "original_text": text,
                        "drop_logs": {"word": w, "label": l},
                        "reason_type": l,
                        "explanations": [],
                    }
                    filter_service.save_to_es(raw, es_decision)
            except Exception as e:
                logger.exception("❌ ES 저장 실패 (AUTO)")
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
                    "decision": {"action": "DROP", "reason_type": top_category},
                    "schema_version": "1.0.0",
                },
                headers=[("traceparent", trace_id.encode())] if trace_id else None,
            )

            log_filter_process(text, {}, mode="rule", filtered_words_details=ev.get("filtered_words_details"))


        else:
            decision = filter_classifier(final_text or text, model, tokenizer)
            # logger.info("🤖 ML 분류 결과: %s", decision)

            # 한국어 요약 로그 출력
            log_filter_process(text, decision, mode="ml")

            if decision["status"] == "drop":
                original_tokens = estimate_tokens(text)
                saved_cost, saved_energy, saved_co2, _ = estimate_usage_by_tokens(original_tokens)

                raw = RawFilteredMessage(
                    trace_id=trace_id,
                    room_id=room_id,
                    message_id=message_id,
                    user_id=user_id,
                    text=text,
                    final_text="",
                    timestamp=ev.get("timestamp"),
                    schema_version=ev.get("schema_version", "1.0.0"),
                )
                filter_service.save_filter_results(raw, decision, rule_name="no_meaning")

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
                except Exception as e:
                    logger.exception("❌ DB 저장 실패 (ML DROP)")
                    error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                try:
                    filter_service.save_to_es(raw, decision)
                except Exception as e:
                    logger.exception("❌ ES 저장 실패 (ML DROP)")
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

            else:
                # === PASS 처리 ===
                raw = RawFilteredMessage(
                    trace_id=trace_id,
                    room_id=room_id,
                    message_id=message_id,
                    user_id=user_id,
                    text=text,
                    final_text=decision.get("content") or "",
                    timestamp=ev.get("timestamp"),
                    schema_version=ev.get("schema_version", "1.0.0"),
                )

                original_tokens = estimate_tokens(text)
                cleaned_text = decision.get("content") or (final_text or text)
                cleaned_tokens = estimate_tokens(cleaned_text)
                saved_tokens = max(0, original_tokens - cleaned_tokens)

                cost_usd, energy_wh, co2_g, _ = estimate_usage_by_tokens(cleaned_tokens)
                saved_cost, saved_energy, saved_co2, _ = estimate_usage_by_tokens(saved_tokens)

                if decision.get("drop_logs"):
                    filter_service.save_filter_results(raw, decision, rule_name="no_meaning")

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
                except Exception as e:
                    logger.exception("❌ DB 저장 실패 (ML PASS)")
                    error_service.save_error(trace_id, "DB_INSERT_ERROR", e)

                try:
                    filter_service.save_to_es(raw, decision)
                except Exception as e:
                    logger.exception("❌ ES 저장 실패 (ML PASS)")
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


if __name__ == "__main__":
    run_filter_worker()
