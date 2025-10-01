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

KOREAN_PARTICLES = {"은", "는", "이", "가", "를", "을", "이야", '나', "두", "도", "에", "게", "만", "까지", "이다", "의", "에서", "서", "이라고", "랑"}

def token_has_particle(token: str) -> bool:
    return any(token.endswith(p) for p in KOREAN_PARTICLES)


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
    threshold: float = 0.8,
    margin: float = 0.05
) -> Dict[str, Any]:

    drop_logs: List[Dict[str, Any]] = []
    kept_sentences: List[str] = []

    # 문장 분리 (.?! 기준)
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

        while tokens:
            matched_prefix = False

            for n in [1, 2, 3]:
                if len(tokens) < n:
                    continue
                prefix = " ".join(tokens[:n])
                pred, probs = classify_text(prefix, model, tokenizer)

                if pred == "meaningful":
                    kept_sentences.append(" ".join(tokens))
                    tokens = []
                    matched_prefix = True
                    break

                top_score = probs[pred]
                use_th = LABEL_THRESHOLDS.get(pred, threshold)
                if pred in PREFIX_FILTER_LABELS and top_score >= use_th:
                    if n == 1 and token_has_particle(tokens[0]):
                        kept_sentences.append(" ".join(tokens))
                        tokens = []
                        matched_prefix = True
                        break

                    drop_logs.append({
                        "원문": sent,
                        "단계": f"{n}-gram prefix",
                        "text": prefix,
                        "label": pred,
                        "confidence": float(top_score),
                        "probs": probs
                    })
                    tokens = tokens[n:]
                    matched_prefix = True
                    break

            if matched_prefix:
                continue  

            remaining = " ".join(tokens)
            pred, probs = classify_text(remaining, model, tokenizer)

            if pred == "meaningful":
                kept_sentences.append(remaining)
                tokens = []
                break

            top_score = probs[pred]
            use_th = LABEL_THRESHOLDS.get(pred, threshold)
            if pred in FULL_FILTER_LABELS and top_score >= use_th:
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
                tokens = []
                break

    final_label = resolve_final_label(drop_logs)
    max_conf = max((log["confidence"] for log in drop_logs), default=0.0)

    if kept_sentences:
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
            "kept_sentences": []
        }
