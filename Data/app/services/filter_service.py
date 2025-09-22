from datetime import datetime, timedelta, timezone
from difflib import ndiff
from typing import List, Dict, Any
from app.contracts.raw_filtered import RawFilteredMessage
from app.adapters.db import get_session
from app.adapters.es import get_es_client
from app.models import FilterResult

# 한국시간 타임존 정의
KST = timezone(timedelta(hours=9))


def save_filter_results(raw: RawFilteredMessage, decision: Dict[str, Any], rule_name: str = "ml"):
    """
    DB에 필터링 결과 저장
    - filter_result 테이블에만 기록
    - decision은 filter_classifier의 dict 반환값을 사용
    """
    with get_session() as session:
        filter_entry = FilterResult(
            chat_room_id=raw.room_id,
            message_id=raw.message_id,
            stage="ml",
            action=decision["status"].upper(),   # "PASS" / "DROP"
            rule_name=decision.get("label") or rule_name,
            score=decision.get("score", 0.0),
            created_at=datetime.now(timezone.utc),  # DB는 UTC 기준
            trace_id=raw.trace_id,
        )
        session.add(filter_entry)
        session.commit()


def _as_list(x) -> List[str]:
    if x is None:
        return []
    if isinstance(x, list):
        return [str(i) for i in x if str(i).strip()]
    s = str(x).strip()
    return [s] if s else []


def _compute_dropped_tokens_by_diff(original_text: str, cleaned_text: str) -> List[str]:
    """PASS일 때 실제 제거된 토큰 계산 (공백 기준 + ndiff)"""
    if original_text is None:
        original_text = ""
    if cleaned_text is None:
        cleaned_text = original_text
    orig = original_text.split()
    clean = cleaned_text.split()
    drops: List[str] = []
    for op in ndiff(orig, clean):
        if op.startswith("- "):
            tok = op[2:].strip()
            if tok:
                drops.append(tok)
    return drops


def save_to_es(raw: RawFilteredMessage, decision: Dict[str, Any]) -> None:
    """
    ES에 filtered_words_details 또는 drop_logs 기반으로 '드롭된 부분' 저장
    문서 구조:
    {
      "trace_id": "...",
      "user_id": "...",
      "dropped_text": "...",
      "reason_type": "...",
      "created_at": "..."   # 한국시간
    }
    """
    es = get_es_client()
    docs: List[Dict[str, Any]] = []
    now = datetime.now(KST).isoformat()  # 한국시간 ISO8601

    # 1) auto 모드: filtered_words_details
    words = getattr(raw, "filtered_words_details", [[], []])[0]
    labels = getattr(raw, "filtered_words_details", [[], []])[1]

    if words and labels:
        for w, l in zip(words, labels):
            docs.append({
                "trace_id": raw.trace_id,
                "user_id": raw.user_id,
                "dropped_text": w,
                "reason_type": l,
                "created_at": now,
            })

    # 2) pass 모드: decision.drop_logs
    else:
        logs = decision.get("drop_logs", [])
        if isinstance(logs, list) and len(logs) > 0:
            for log in logs:
                dropped_list = _as_list(log.get("필터된 내용") or log.get("dropped_text"))
                if not dropped_list:
                    continue
                reason = log.get("라벨") or decision.get("label")
                for dropped in dropped_list:
                    docs.append({
                        "trace_id": raw.trace_id,
                        "user_id": raw.user_id,
                        "dropped_text": dropped,
                        "reason_type": reason,
                        "created_at": now,
                    })

    # 3) ES 색인
    for doc in docs:
        es.index(index="filter-logs", document=doc)
