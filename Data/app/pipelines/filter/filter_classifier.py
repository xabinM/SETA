import torch
from typing import Dict, Any, List, Optional

PREFIX_FILTER_LABELS = {
    "call_only", "reaction_only", "greeting",
    "thank", "goodbye", "apology", "connector_filler", "no_meaning"
}
FULL_FILTER_LABELS = PREFIX_FILTER_LABELS

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


def classify_text(text, model, tokenizer):
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
    threshold: float = 0.8,
    margin: float = 0.05
) -> Dict[str, Any]:
    drop_logs: List[Dict[str, Any]] = []
    kept_sentences: List[str] = []

    # 문장 분리 (.?! 기준)
    sentences = []
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

        sentence_force_pass = False

        while tokens:
            matched_prefix = False
            for n in [1, 2, 3]:
                if len(tokens) < n:
                    continue
                prefix = " ".join(tokens[:n])
                pred, probs = classify_text(prefix, model, tokenizer)

                # meaningful → 문장 전체 PASS
                if pred == "meaningful":
                    kept_sentences.append(" ".join(tokens))
                    sentence_force_pass = True
                    matched_prefix = True
                    break

                top_score = probs[pred]
                if pred in PREFIX_FILTER_LABELS and top_score >= LABEL_THRESHOLDS.get(pred, threshold):
                    # 앞 n 토큰만 제거
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

            if sentence_force_pass:
                break

            if matched_prefix:
                # 잘린 토큰이 남아있으면 다시 검사
                if not tokens:
                    tokens = []
                    break
                else:
                    continue

            # prefix 매칭 안 된 경우 → 남은 tokens 전체 검사
            remaining = " ".join(tokens)
            pred, probs = classify_text(remaining, model, tokenizer)

            if pred == "meaningful":
                kept_sentences.append(remaining)
                sentence_force_pass = True
                break

            top_score = probs[pred]
            if pred in FULL_FILTER_LABELS and top_score >= LABEL_THRESHOLDS.get(pred, threshold):
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
                kept_sentences.append(remaining)
                break

        # while 종료
        if sentence_force_pass:
            continue
        if tokens:
            kept_sentences.append(" ".join(tokens))

    final_label = resolve_final_label(drop_logs)
    max_conf = max([log["confidence"] for log in drop_logs], default=0.0)

    if kept_sentences:
        if not drop_logs:  # 아무것도 안 잘렸다면 라벨/스코어 없음
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
