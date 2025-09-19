import torch
from typing import Dict, Any, List


# === 필터 라벨 세트 ===
PREFIX_FILTER_LABELS = {
    "call_only", "reaction_only", "greeting",
    "thank", "goodbye", "apology", "connector_filler", "no_meaning"
}
FULL_FILTER_LABELS = PREFIX_FILTER_LABELS

# === 라벨별 threshold ===
LABEL_THRESHOLDS = {
    "call_only": 0.95,
    "reaction_only": 0.90,
    "greeting": 0.90,
    "thank": 0.90,
    "apology": 0.90,
    "goodbye": 0.90,
    "connector_filler": 0.90,
    "no_meaning": 0.90,
    "meaningful": 0.00,
}

# === 라벨 우선순위 ===
LABEL_PRIORITY = {
    "goodbye": 1,
    "apology": 2,
    "thank": 4,
    "greeting": 8,
    "call_only": 16,
    "reaction_only": 32,
    "no_meaning": 64,
    "connector_filler": 128,
    "meaningful": 0
}

def resolve_final_label(drop_logs):
    dropped_labels = [log["라벨"] for log in drop_logs if "success" in log.get("단계", "")]
    if not dropped_labels:
        return "no_meaning"

    mask = 0
    for label in dropped_labels:
        mask |= LABEL_PRIORITY.get(label, 0)

    for label, bit in sorted(LABEL_PRIORITY.items(), key=lambda x: x[1]):
        if bit > 0 and (mask & bit):
            return label

    return "no_meaning"

def classify_text(text, model, tokenizer):
    model.eval()
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1).squeeze().tolist()

    id2label = model.config.id2label
    pred_idx = torch.argmax(logits).item()
    pred_label = id2label[pred_idx]
    prob_dict = {id2label[i]: float(p) for i, p in enumerate(probs)}
    return pred_label, prob_dict, float(probs[pred_idx])

def filter_classifier(input_text: str, model, tokenizer, threshold=0.8, margin=0.05) -> Dict[str, Any]:
    """
    문장을 토큰 단위로 분리 → 슬라이딩 윈도우 기반으로 분류 → 필터링 수행.
    최종적으로 PASS / DROP 여부와 cleaned_text, 라벨, 로그를 반환.
    """

    drop_logs: List[Dict[str, Any]] = []
    kept_sentences: List[str] = []

    # 문장 분리 (. ? ! 기준)
    sentences = []
    buf = ""
    for ch in input_text:
        buf += ch
        if ch in ".?!":
            sentences.append(buf.strip())
            buf = ""
    if buf.strip():
        sentences.append(buf.strip())

    # 각 문장 처리
    for sent in sentences:
        tokens = sent.split()
        filtered_out = False

        # 앞부분 1~3gram 슬라이딩 검사
        for n in [1, 2, 3]:
            if len(tokens) < n:
                continue
            prefix = " ".join(tokens[:n])
            pred, probs = classify_text(prefix, model, tokenizer)
            top_score = probs[pred]

            if top_score >= threshold:
                drop_logs.append({
                    "원문": sent,
                    "단계": f"{n}-gram",
                    "span": (0, n),
                    "text": prefix,
                    "label": pred,
                    "confidence": float(top_score),
                    "probs": probs
                })
                filtered_out = True
                break

        if not filtered_out:
            # 문장 전체 검사
            pred, probs = classify_text(sent, model, tokenizer)
            top_score = probs[pred]
            if top_score >= threshold:
                drop_logs.append({
                    "원문": sent,
                    "단계": "full-sentence",
                    "label": pred,
                    "confidence": float(top_score),
                    "probs": probs
                })
            else:
                kept_sentences.append(sent)

    # 최종 라벨 결정
    final_label = resolve_final_label(drop_logs) if drop_logs else None

    # === 최종 반환 ===
    if kept_sentences:
        return {
            "status": "pass",
            "content": " ".join(kept_sentences),   # cleaned_text에 들어갈 부분
            "label": final_label,
            "score": max([log["confidence"] for log in drop_logs], default=0.0),
            "drop_logs": drop_logs,
            "kept_sentences": kept_sentences
        }
    else:
        return {
            "status": "drop",
            "content": "",
            "label": final_label,
            "score": max([log["confidence"] for log in drop_logs], default=0.0),
            "drop_logs": drop_logs,
            "kept_sentences": kept_sentences
        }

