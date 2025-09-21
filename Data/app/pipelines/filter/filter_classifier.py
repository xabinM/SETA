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

def filter_classifier(input_text: str, model, tokenizer, threshold=0.8, margin=0.05) -> Dict[str, Any]:
    drop_logs: List[Dict[str, Any]] = []
    kept_sentences: List[str] = []

    # 문장 분리
    sentences = []
    buf = ""
    for ch in input_text:
        buf += ch
        if ch in ".?!,":
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
        # 토큰 수준 전처리 루프: 앞 1~3gram 필터 → 제거 후 계속
        while tokens:
            # 1~3gram 검사 (긴 n 우선 또는 짧은 n 우선은 정책에 따라; 여기서는 1→3)
            matched_prefix = False
            for n in [1, 2, 3]:
                if len(tokens) < n:
                    continue
                prefix = " ".join(tokens[:n])
                pred, probs = classify_text(prefix, model, tokenizer)

                # meaningful → 즉시 PASS (해당 문장 종료, drop_logs에 기록하지 않음)
                if pred == "meaningful":
                    kept_sentences.append(" ".join(tokens))
                    sentence_force_pass = True
                    matched_prefix = True
                    break

                top_score = probs[pred]
                if pred in PREFIX_FILTER_LABELS and top_score >= threshold:
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
                    tokens = tokens[n:]  # 앞부분 절단
                    matched_prefix = True
                    break

            if sentence_force_pass:
                break
            if not matched_prefix:
                # 더 이상 자를 prefix가 없으면 full-sentence 검사
                remaining = " ".join(tokens)
                pred, probs = classify_text(remaining, model, tokenizer)

                if pred == "meaningful":
                    kept_sentences.append(remaining)
                    sentence_force_pass = True
                    break

                top_score = probs[pred]
                if pred in FULL_FILTER_LABELS and top_score >= threshold:
                    # 전체 문장도 필터 라벨 → 해당 문장은 드랍(토큰 비움)
                    drop_logs.append({
                        "원문": sent,
                        "단계": "full-sentence",
                        "label": pred,
                        "confidence": float(top_score),
                        "probs": probs
                    })
                    tokens = []  # 문장 드랍
                    break
                else:
                    kept_sentences.append(remaining)
                    break

        # while 종료: sentence_force_pass면 이미 kept_sentences에 들어감
        # tokens가 남아있다면 그 자체가 kept에 반영됐으므로 추가 처리 불필요

    final_label = resolve_final_label(drop_logs)
    max_conf = max([log["confidence"] for log in drop_logs], default=0.0)

    if kept_sentences:
        # 실제 드랍이 하나도 없었다면 라벨/스코어 비우기
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
