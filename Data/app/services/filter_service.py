from datetime import datetime, timezone
from app.contracts.raw_filtered import RawFilteredMessage
from app.pipelines.filter.filter_engine import IntentDecision
from app.adapters.db import get_session
from app.adapters.es import get_es_client
from app.models import FilterResult, ChatMessage


def save_filter_results(raw: RawFilteredMessage, decision: IntentDecision, rule_name: str = "ml"):
    """
    DB에 필터링 결과 저장
    1) chat_message.filtered_content 업데이트 (PASS인 경우 → cleaned_text 반영)
    2) filter_result 테이블에 intent_classifier 결과 INSERT
    """
    with get_session() as session:
        # (1) PASS → chat_message.filtered_content 업데이트
        if decision.action == "PASS":
            session.query(ChatMessage).filter(
                ChatMessage.message_id == raw.message_id
            ).update({
                "filtered_content": decision.cleaned_text or raw.final_text or raw.text
            })

        # (2) filter_result INSERT
        fr = FilterResult(
            trace_id=raw.trace_id,
            chat_room_id=raw.room_id,
            message_id=raw.message_id,
            stage="ml",                          # stage는 rule/ml 구분
            action=decision.action,              # PASS or DROP
            rule_name=decision.intent or "None",  # 필터링된 이유 (thank, greeting ...) 없으면 None
            score=decision.score,                # 확률값
            created_at=datetime.now(timezone.utc),
        )
        session.add(fr)
        session.commit()


def save_to_es(raw: RawFilteredMessage, decision: IntentDecision):
    """
    Elasticsearch에 필터링 로그 저장
    """
    es = get_es_client()
    doc = {
        "trace_id": raw.trace_id,
        "room_id": raw.room_id,
        "message_id": raw.message_id,
        "original_text": raw.text,
        "cleaned_text": decision.cleaned_text or raw.final_text or raw.text,
        "reason_type": decision.intent,
        "action": decision.action,
        "score": decision.score,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    es.index(index="filter-logs", document=doc)
