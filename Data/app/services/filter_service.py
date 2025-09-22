from datetime import datetime, timezone
from app.contracts.raw_filtered import RawFilteredMessage
from app.pipelines.filter.filter_engine import IntentDecision
from app.adapters.db import get_session
from app.adapters.es import get_es_client
from app.models import FilterResult, ChatMessage

def save_filter_results(raw: RawFilteredMessage, decision: IntentDecision, rule_name: str = "ml"):
    """
    DB에 필터링 결과 저장
    1) PASS → chat_message.filtered_content 업데이트 (Spark 1차 정제 결과 반영: raw.final_text)
    2) filter_result INSERT (rule_name = decision.reason_type)
    """
    with get_session() as session:
        # (1) PASS → chat_message.filtered_content 업데이트
        if decision.action == "PASS":
            msg = session.query(ChatMessage).filter(
                ChatMessage.message_id == raw.message_id
            ).first()
            if msg:
                msg.filtered_content = decision.cleaned_text or raw.final_text or raw.text
                session.add(msg)

        # (2) filter_result INSERT
        fr = FilterResult(
            trace_id=raw.trace_id,
            chat_room_id=raw.room_id,
            message_id=raw.message_id,
            stage="ml",                              # stage는 rule/ml 구분
            action=decision.action,                  # PASS or DROP
            rule_name=(decision.reason_type or "None"),  # ← 여기 수정
            score=float(decision.score),
            created_at=datetime.now(timezone.utc),
        )
        session.add(fr)
        session.commit()

def save_to_es(raw: RawFilteredMessage, decision: IntentDecision):
    """
    Elasticsearch에 필터링 로그 저장
    - PASS: drop_logs 중 'success-drop' 단계만 저장
    - DROP: drop_logs 전체 저장
    """
    es = get_es_client()

    if not decision.drop_logs:
        return

    for log in decision.drop_logs:
        # PASS → success-drop 단계만 기록
        if decision.action == "PASS" and "success-drop" not in log.get("단계", ""):
            continue

        doc = {
            "trace_id": raw.trace_id,
            "room_id": raw.room_id,
            "message_id": raw.message_id,
            "original_text": log.get("원문"),
            "dropped_text": log.get("필터된 내용"),
            "remaining_text": log.get("남은 내용"),
            "reason_type": log.get("라벨"),
            "stage": log.get("단계"),
            "score": log.get("확률"),
            "action": decision.action,  # 최종 PASS or DROP
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        es.index(index="filter-logs", document=doc)
