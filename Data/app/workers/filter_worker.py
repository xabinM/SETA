import os
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from app.adapters.kafka_io import make_consumer, make_producer, publish
from app.adapters.db import get_session
from app.services import filter_service
from app.pipelines.filter.my_engine import MyFilterEngine
from app.contracts.raw_filtered import RawFilteredMessage  # Spark에서 오는 이벤트 형식

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN", "chat.raw.filtered.v1")
KAFKA_OUT = os.getenv("KAFKA_TOPIC_OUT", "chat.filter.result.v1")
MODEL_DIR = os.getenv("FILTER_MODEL_DIR", "/app/models/filter")

def run_worker():
    consumer = make_consumer(KAFKA_IN, group_id="filter-worker")
    producer = make_producer()

    # 모델 로드 (한 번만)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    engine = MyFilterEngine(model, tokenizer)

    for msg in consumer:
        raw_dict = msg.value  # dict 형태
        raw = RawFilteredMessage(**raw_dict)  # dataclass 변환

        # Spark에서 전달된 mode 확인
        if raw.mode == "auto":
            # Spark에서 룰 기반으로 DROP 처리된 경우
            decision = engine._make_auto_decision()  # 별도 util 함수로 "DROP" IntentDecision 생성
            rule_name = "rule"
        else:
            # mode=pass → 우리가 BERT 돌려서 분류
            decision = engine.intent_classifier(raw.text, raw.final_text or raw.text)
            rule_name = "ml"

        # DB 저장
        with get_session() as session:
            filter_service.save_filter_results(raw, decision, rule_name=rule_name)

        # ES 저장
        filter_service.save_to_es(raw, decision)

        # Kafka 발행
        event = {
            "trace_id": raw.trace_id,
            "room_id": raw.room_id,
            "message_id": raw.message_id,
            "action": decision.action,
            "rule": rule_name,
            "cleaned_text": raw.final_text if decision.action == "PASS" else None,
            "label": decision.reason_type,
            "score": decision.score,
            "schema_version": "1.0.0"
        }
        publish(producer, KAFKA_OUT, key=raw.room_id, value=event)
