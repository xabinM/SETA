from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.contracts.raw_filtered_schema import RawFilteredMessageSchema
from app.adapters.db import get_session
from app.services import filter_service
from app.pipelines.filter.filter_classifier import filter_classifier

router = APIRouter()

# 모델/토크나이저 미리 로드 (서버 시작 시 1회)
model = AutoModelForSequenceClassification.from_pretrained("/app/models/filter")
tokenizer = AutoTokenizer.from_pretrained("/app/models/filter")


@router.post("/debug/filter")
def debug_filter(msg: RawFilteredMessageSchema, db: Session = Depends(get_session)):
    """
    개발/테스트용 엔드포인트:
    - RawFilteredMessageSchema 입력
    - BERT 필터 분류 실행
    - DB(filter_result, chat_message) & ES(filter-logs) 저장
    - 결과 JSON 반환
    """

    decision = filter_classifier(msg.final_text or msg.text, model, tokenizer)

    # DB 저장
    filter_service.save_filter_results(msg, decision, rule_name="ml")
    # ES 저장
    filter_service.save_to_es(msg, decision)

    return {
    "trace_id": msg.trace_id, "room_id": msg.room_id, "message_id": msg.message_id,
    "action": decision["status"], "rule": "ml",
    "cleaned_text": decision["content"] if decision["status"]=="pass" else None,
    "label": decision.get("label"), "score": decision.get("score"),
    "schema_version": msg.schema_version,
    }
