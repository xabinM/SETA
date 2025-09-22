from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.contracts.raw_filtered_schema import RawFilteredMessageSchema
from app.pipelines.filter.my_engine import MyFilterEngine
from app.adapters.db import get_session
from app.services import filter_service

router = APIRouter()

# 모델 미리 로드 (서버 시작 시 1회)
model = AutoModelForSequenceClassification.from_pretrained("/app/models/filter")
tokenizer = AutoTokenizer.from_pretrained("/app/models/filter")
engine = MyFilterEngine(model, tokenizer)


@router.post("/debug/filter")
def debug_filter(msg: RawFilteredMessageSchema, db: Session = Depends(get_session)):
    """
    개발/테스트용 엔드포인트:
    - RawFilteredMessageSchema 입력
    - BERT 필터 분류 실행
    - DB(filter_result, chat_message) & ES(filter-logs) 저장
    - 결과 JSON 반환
    """

    # 1. 모델 분류 실행
    decision = engine.intent_classifier(msg.text, msg.final_text or msg.text)

    # 2. DB 저장
    filter_service.save_filter_results(msg, decision, rule_name="ml")

    # 3. ES 저장
    filter_service.save_to_es(msg, decision)

    # 4. 결과 반환 (운영과 동일한 구조)
    return {
        "trace_id": msg.trace_id,
        "room_id": msg.room_id,
        "message_id": msg.message_id,
        "action": decision.action,
        "rule": "ml",
        "cleaned_text": (decision.cleaned_text if decision.action == "PASS" else None),  # ✅ 변경
        "label": decision.reason_type,
        "score": decision.score,
        "schema_version": msg.schema_version
    }

