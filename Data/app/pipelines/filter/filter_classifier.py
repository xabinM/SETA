import torch
from typing import Dict, Any, List, Optional

# 필터 라벨 세트
PREFIX_FILTER_LABELS = {
    "call_only", "reaction_only", "greeting",
    "thank", "goodbye", "apology", "connector_filler", "no_meaning"
}
FULL_FILTER_LABELS = PREFIX_FILTER_LABELS

# 라벨별 threshold (없으면 threshold 인자 사용)
LABEL_THRESHOLDS = {
    "call_only": 0.95,
    "reaction_only": 0.90,
    "greeting": 0.90,
    "thank": 0.90,
    "apology": 0.90,
    "goodbye": 0.90,
    "connector_filler": 0.90,
    "no_meaning": 0.90,
    "meaningful": 0.00,   # meaningful은 강제 PASS
}

# 최종 라벨 우선순위 (낮을수록 우선)
LABEL_PRIORITY = {
    "goodbye": 1,
    "apology": 2,
    "thank": 3,
    "greeting": 4,
    "call_only": 5,
    "reaction_only": 6,
    "no_meaning": 7,
    "connector_filler": 8,
}

def resolve_final_label(drop_logs: List[Dict[str, Any]]) -> Optional[str]:
    if not drop_logs:
        return None
    detected = {log.get("label") for log in drop_logs if log.get("label")}
    for label, _ in sorted(LABEL_PRIORITY.items(), key=lambda x: x[1]):
        if label in detected:
            return label
    return "no_meaning"

def classify_text(text: str, model, tokenizer):
    model.eval()
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1).squeeze().tolist()
    id2label = model.config.id2label
    pred_idx = int(torch.argmax(logits).item())
    pred_label = id2label[pred_idx]
    prob_dict = {id2label[i]: float(p) for i, p in enumerate(probs)}
    return pred_label, prob_dict

def filter_classifier(
    input_text: str,
    model,
    tokenizer,
    threshold: float = 0.8,  # 기본 임계값 (LABEL_THRESHOLDS에 없을 때 fallback)
    margin: float = 0.05     # 예약(현재 미사용)
) -> Dict[str, Any]:
    drop_logs: List[Dict[str, Any]] = []
    kept_sentences: List[str] = []

    # 문장 분리 (.?! 기준) — 없으면 한 문장 처리
    sentences: List[str] = []
    buf = ""
    for ch in input_text:
        buf += ch
        if ch in ".?!":
            if buf.strip():
                sentences.append(buf.strip())
            buf = ""
    if buf.strip():
        sentences.append(buf.strip())

    for sent in sentences:
        tokens = sent.split()
        if not tokens:
            continue

        sentence_kept_fragments: List[str] = []

        # 남은 토큰이 있는 동안 반복
        while tokens:
            matched_prefix = False

            # 앞 1~3gram 검사 (짧은 n부터 — 필요 시 [3,2,1]로 바꿔도 됨)
            for n in [1, 2, 3]:
                if len(tokens) < n:
                    continue
                prefix = " ".join(tokens[:n])
                pred, probs = classify_text(prefix, model, tokenizer)

                # meaningful → 남은 토큰 전체 PASS, 이 문장 종료
                if pred == "meaningful":
                    sentence_kept_fragments.append(" ".join(tokens))
                    tokens = []
                    matched_prefix = True
                    break

                top_score = probs[pred]
                use_th = LABEL_THRESHOLDS.get(pred, threshold)
                if pred in PREFIX_FILTER_LABELS and top_score >= use_th:
                    # 앞 n 토큰만 제거하고 계속 검사
                    drop_logs.append({
                        "원문": sent,
                        "단계": f"{n}-gram",
                        "span": (0, n),
                        "text": prefix,
                        "label": pred,
                        "confidence": float(top_score),
                        "probs": probs
                    })
                    tokens = tokens[n:]
                    matched_prefix = True
                    break

            if matched_prefix:
                # meaningful이거나 prefix 드랍이 일어났음 → 남은 tokens로 계속 루프
                continue

            # prefix 매칭이 더 이상 안 될 때 → 남은 전체 검사
            remaining = " ".join(tokens)
            pred, probs = classify_text(remaining, model, tokenizer)

            if pred == "meaningful":
                sentence_kept_fragments.append(remaining)
                tokens = []
                break

            top_score = probs[pred]
            use_th = LABEL_THRESHOLDS.get(pred, threshold)
            if pred in FULL_FILTER_LABELS and top_score >= use_th:
                # 전체 문장을 필터 라벨로 판단 → 문장 드랍
                drop_logs.append({
                    "원문": sent,
                    "단계": "full-sentence",
                    "label": pred,
                    "confidence": float(top_score),
                    "probs": probs
                })
                tokens = []
                break
            else:
                # 남은 전체 유지하고 문장 종료
                sentence_kept_fragments.append(remaining)
                tokens = []
                break

        # 문장 단위 결과 반영 (원문이 아니라 절단 후 남은 토큰만)
        if sentence_kept_fragments:
            kept_sentences.append(" ".join(sentence_kept_fragments))

    # 최종 라벨/스코어
    final_label = resolve_final_label(drop_logs)
    max_conf = max((log["confidence"] for log in drop_logs), default=0.0)

    if kept_sentences:
        # 실제 드랍이 하나도 없었다면 라벨/스코어 제거
        if not drop_logs:
            final_label = None
            max_conf = 0.0
        return {
            "status": "pass",
            "content": " ".join(kept_sentences),
            "label": final_label,
            "score": max_conf,
            "drop_logs": drop_logs,
            "kept_sentences": kept_sentences
        }
    else:
        return {
            "status": "drop",
            "content": "",
            "label": final_label,
            "score": max_conf,
            "drop_logs": drop_logs,
            "kept_sentences": kept_sentences
        }
