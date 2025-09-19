# app/services/filter_service.py

from datetime import datetime, timezone
from typing import Optional

from app.contracts.raw_filtered import RawFilteredMessage
from app.pipelines.filter.filter_engine import IntentDecision
from app.adapters.db import get_session
from app.adapters.es import get_es_client
from app.models import FilterResult, ChatMessage

ES_INDEX = "filter-logs"


def _compute_filtered_terms(original_text: str, cleaned_text: str) -> list[str]:
    """
    original vs cleaned 차이를 간단히 토큰 기준으로 기록.
    운영에서 정교한 diff가 필요하면 여기만 교체해주면 됨.
    """
    if not original_text:
        return []
    if not cleaned_text:
        return [original_text] 
    orig = set(original_text.split())
    cln  = set(cleaned_text.split())
    removed = list(orig - cln)
    # 너무 길어지는 것 방지 (운영 시 적절히 조절)
    return removed[:64]

def save_filter_results(raw, decision=None, stage="rule", rule_name=None):
    """
    FilterResult 저장 함수
    - raw: Kafka에서 받은 메시지 (RawFilteredMessage)
    - decision: ML 분류 결과 객체 (있을 때만 사용)
    - stage: rule / ml
    - rule_name:
        * rule → raw.top_category (없으면 "unknown")
        * ml   → decision.label (없으면 None)
    """

    with get_session() as session:
        if stage == "rule":
            fr = FilterResult(
                trace_id=raw.trace_id,
                chat_room_id=raw.room_id,
                message_id=raw.message_id,
                stage="rule",
                action="DROP",
                rule_name=raw.top_category or "unknown",
                score=1.0,
                created_at=datetime.now(timezone.utc),
            )
        elif stage == "ml" and decision:
            fr = FilterResult(
                trace_id=raw.trace_id,
                chat_room_id=raw.room_id,
                message_id=raw.message_id,
                stage="ml",
                action=decision.action,
                rule_name=rule_name or decision.label or None,
                score=decision.score,
                created_at=datetime.now(timezone.utc),
            )
        else:
            raise ValueError("Invalid save_filter_results call")

        session.add(fr)
        session.commit()


def save_to_es(raw: RawFilteredMessage, decision: IntentDecision) -> None:
    """
    Elasticsearch에 필터링 로그 저장
      - action=DROP:
          * rule_name(=reason_type)와 함께 원문 전체가 필터링 됐는지 기록
      - action=PASS:
          * original vs cleaned 차집합(removed terms)을 기록
    """
    es = get_es_client()
    if decision.action == "DROP":
        # 모델로 전체가 드랍된 케이스 → 운영 명세상 auto와 동일하게 전체를 필터링된 내용으로 간주
        doc = {
            "trace_id": raw.trace_id,
            "room_id": raw.room_id,
            "message_id": raw.message_id,
            "stage": "ml",
            "action": "DROP",
            "rule_name": decision.reason_type,  # thank/greeting/...
            "original_text": raw.text,
            "cleaned_text": "",  # 전체 드랍
            "filtered_terms": [raw.text],  # 전체가 필터링되었음을 명시
            "score": decision.score,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    else:
        # PASS → 차집합 기록
        cleaned = raw.final_text or raw.text
        doc = {
            "trace_id": raw.trace_id,
            "room_id": raw.room_id,
            "message_id": raw.message_id,
            "stage": "ml",
            "action": "PASS",
            "rule_name": None,  # PASS면 이유 없음(운영 정책상 필요하면 "meaningful")
            "original_text": raw.text,
            "cleaned_text": cleaned,
            "filtered_terms": _compute_filtered_terms(raw.text, cleaned),
            "score": decision.score,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    es.index(index=ES_INDEX, document=doc)
