from datetime import datetime, timedelta, timezone
from difflib import ndiff
from typing import List, Dict, Any
from app.contracts.raw_filtered import RawFilteredMessage
from app.adapters.db import get_session
from app.utils.es import get_es
from app.models import FilterResult

# 한국시간 타임존 정의
KST = timezone(timedelta(hours=9))


def save_filter_results(raw: RawFilteredMessage, decision: Dict[str, Any], rule_name: str = "no_meaning"):
    with get_session() as session:
        filter_entry = FilterResult(
            chat_room_id=raw.room_id,
            message_id=raw.message_id,
            stage="ml",
            action=decision["status"].upper(),
            rule_name=decision.get("label") or rule_name,
            score=decision.get("score", 0.0),
            created_at=datetime.now(timezone.utc),
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
    es = get_es()
    docs: List[Dict[str, Any]] = []
    now = datetime.now(KST).isoformat()

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

    else:
        logs = decision.get("drop_logs", []) if isinstance(decision, dict) else getattr(decision, "drop_logs", [])
        if isinstance(logs, list) and len(logs) > 0:
            for log in logs:
                dropped_list = _as_list(log.get("text") or log.get("원문") or log.get("dropped_text"))
                if not dropped_list:
                    continue
                reason = log.get("label") or decision.get("label")
                for dropped in dropped_list:
                    docs.append({
                        "trace_id": raw.trace_id,
                        "user_id": raw.user_id,
                        "dropped_text": dropped,
                        "reason_type": reason,
                        "created_at": now,
                    })


    for doc in docs:
        es.index(index="filter-logs", document=doc)
