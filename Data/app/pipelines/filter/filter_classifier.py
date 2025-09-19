import torch

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

def filter_classifier(input_text, model, tokenizer, margin: float = 0.1):
    drop_logs = []
    kept_sentences = []
    top_score = 0.0

    sentences = [
        s.strip() for s in input_text.replace("?", ".").replace("!", ".").split(".")
        if s.strip()
    ]

    for sent in sentences:
        tokens = sent.split()
        if not tokens:
            continue

        while tokens:
            matched = False
            for n in [1, 2, 3]:
                if len(tokens) < n:
                    continue
                prefix = " ".join(tokens[:n])
                pred, probs, best_score = classify_text(prefix, model, tokenizer)
                top_score = max(top_score, best_score)

                if pred == "meaningful":
                    kept_sentences.append(" ".join(tokens))
                    drop_logs.append({
                        "원문": sent,
                        "단계": f"{n}-gram prefix (force-pass)",
                        "라벨": pred,
                        "확률": best_score
                    })
                    tokens = []
                    matched = True
                    break

                probs_sorted = sorted(probs.values(), reverse=True)
                top_p, second_p = probs_sorted[0], (probs_sorted[1] if len(probs_sorted) > 1 else 0.0)
                margin_diff = top_p - second_p
                threshold = LABEL_THRESHOLDS.get(pred, 0.9)

                drop_logs.append({
                    "원문": sent,
                    "시도_prefix": prefix,
                    "단계": f"{n}-gram prefix (try)",
                    "라벨": pred,
                    "확률": probs[pred]
                })

                if (pred in PREFIX_FILTER_LABELS) and (top_p >= threshold) and (margin_diff >= margin):
                    tokens = tokens[n:]
                    drop_logs.append({
                        "원문": sent,
                        "필터된 내용": prefix,
                        "남은 내용": " ".join(tokens),
                        "단계": f"{n}-gram prefix (success)",
                        "라벨": pred,
                        "확률": float(top_p)
                    })
                    matched = True
                    break
            if not matched:
                break

        remaining = " ".join(tokens).strip()
        if not remaining:
            continue

        pred, probs, best_score = classify_text(remaining, model, tokenizer)
        top_score = max(top_score, best_score)

        if pred == "meaningful":
            kept_sentences.append(remaining)
            drop_logs.append({
                "원문": sent,
                "단계": "문장 전체 (force-pass)",
                "라벨": pred,
                "확률": best_score
            })
            continue

        probs_sorted = sorted(probs.values(), reverse=True)
        top_p, second_p = probs_sorted[0], (probs_sorted[1] if len(probs_sorted) > 1 else 0.0)
        margin_diff = top_p - second_p
        threshold = LABEL_THRESHOLDS.get(pred, 0.9)

        drop_logs.append({
            "원문": sent,
            "단계": "문장 전체 (try)",
            "라벨": pred,
            "확률": probs[pred]
        })

        if (pred in FULL_FILTER_LABELS) and (top_p >= threshold) and (margin_diff >= margin):
            drop_logs.append({
                "원문": sent,
                "단계": "문장 전체 (success-drop)",
                "라벨": pred,
                "확률": float(top_p)
            })
            continue

        kept_sentences.append(remaining)
        drop_logs.append({
            "원문": sent,
            "단계": "문장 전체 (success-pass)",
            "라벨": pred,
            "확률": float(top_p)
        })

    if kept_sentences:
        return {
            "status": "pass",
            "content": " ".join(kept_sentences),
            "label": None,
            "score": top_score,
            "drop_logs": drop_logs,
            "kept_sentences": kept_sentences
        }
    else:
        final_label = resolve_final_label(drop_logs)
        return {
            "status": "drop",
            "content": "",
            "label": final_label,
            "score": top_score,
            "drop_logs": drop_logs,
            "kept_sentences": []
        }
