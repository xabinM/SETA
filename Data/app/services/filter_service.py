from datetime import datetime, timezone
from difflib import ndiff
from typing import List, Dict, Any
from app.contracts.raw_filtered import RawFilteredMessage
from app.pipelines.filter.filter_engine import IntentDecision
from app.adapters.db import get_session
from app.adapters.es import get_es_client
from app.models import FilterResult

def save_filter_results(raw: RawFilteredMessage, decision: IntentDecision, rule_name: str = "ml"):
    """
    DB에 필터링 결과 저장
    - filter_result 테이블에만 기록
    """
    with get_session() as session:
        filter_entry = FilterResult(
            chat_room_id=raw.room_id,
            message_id=raw.message_id,
            stage="ml",
            action=decision.action,
            rule_name=decision.reason_type or rule_name,
            score=decision.score,
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


def save_to_es(raw: RawFilteredMessage, decision: IntentDecision) -> None:
    """
    ES에 '드롭된 부분'만 저장
    - drop_logs 있으면 그대로 색인
    - drop_logs 없으면:
        * PASS: diff로 제거된 토큰 색인
        * DROP: 원문 전체 dropped_text로 1건 색인
    """
    es = get_es_client()
    docs: List[Dict[str, Any]] = []

    # 1) drop_logs 기반
    logs = getattr(decision, "drop_logs", None)
    if isinstance(logs, list) and len(logs) > 0:
        for log in logs:
            dropped_list = _as_list(log.get("필터된 내용") or log.get("dropped_text"))
            if not dropped_list:
                continue
            original_text = log.get("원문") or raw.text
            remaining = log.get("남은 내용") or (decision.cleaned_text or raw.final_text or raw.text)
            reason = log.get("라벨") or getattr(decision, "reason_type", None)
            stage  = log.get("단계") or "ml"
            score  = log.get("확률") or getattr(decision, "score", None)
            rule   = log.get("규칙") or getattr(decision, "reason_type", None)

            for dropped in dropped_list:
                docs.append({
                    "trace_id":     raw.trace_id,
                    "room_id":      raw.room_id,
                    "message_id":   raw.message_id,
                    "stage":        stage,
                    "action":       decision.action,
                    "reason_type":  reason,
                    "rule_name":    rule,
                    "score":        score,
                    "original_text": original_text,
                    "dropped_text":  dropped,
                    "remaining_text": remaining,
                    "created_at":   datetime.now(timezone.utc).isoformat(),
                })

    # 2) drop_logs 없을 때 보완
    if not docs:
        if decision.action == "PASS":
            # PASS → diff로 제거된 토큰
            original_text = raw.final_text or raw.text
            cleaned_text  = decision.cleaned_text or raw.final_text or raw.text
            diff_drops = _compute_dropped_tokens_by_diff(original_text, cleaned_text)
            for dropped in diff_drops:
                docs.append({
                    "trace_id":     raw.trace_id,
                    "room_id":      raw.room_id,
                    "message_id":   raw.message_id,
                    "stage":        "ml-diff",
                    "action":       "PASS",
                    "reason_type":  getattr(decision, "reason_type", None),
                    "rule_name":    "diff",
                    "score":        getattr(decision, "score", None),
                    "original_text": raw.text,
                    "dropped_text":  dropped,
                    "remaining_text": cleaned_text,
                    "created_at":   datetime.now(timezone.utc).isoformat(),
                })

        elif decision.action == "DROP":
            # DROP인데 로그가 없으면 원문 전체 보존
            docs.append({
                "trace_id":     raw.trace_id,
                "room_id":      raw.room_id,
                "message_id":   raw.message_id,
                "stage":        "ml",
                "action":       "DROP",
                "reason_type":  getattr(decision, "reason_type", None),
                "rule_name":    getattr(decision, "reason_type", None),
                "score":        getattr(decision, "score", None),
                "original_text": raw.text,
                "dropped_text":  raw.text,
                "remaining_text": decision.cleaned_text or "",
                "created_at":   datetime.now(timezone.utc).isoformat(),
            })

    # 3) 색인
    for doc in docs:
        es.index(index="filter-logs", document=doc)
