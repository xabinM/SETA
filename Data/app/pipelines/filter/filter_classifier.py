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

# === 라벨 우선순위 (낮을수록 우선) ===
LABEL_PRIORITY = {
    "goodbye": 1,          # 🙇 작별
    "apology": 2,          # 🙏 사과
    "thank": 3,            # 🙏 감사
    "greeting": 4,         # 👋 인사
    "call_only": 5,        # 🎯 단순 호출
    "reaction_only": 6,    # 😮 감탄사
    "no_meaning": 7,       # ❌ 의미 없음
    "connector_filler": 8, # 🔗 연결어
}

def resolve_final_label(drop_logs: List[Dict[str, Any]]) -> str:
    """
    여러 라벨이 감지될 경우, 미리 정의한 우선순위(LABEL_PRIORITY)에 따라 최종 라벨을 결정한다.
    """
    if not drop_logs:
        return None

    detected = {log.get("label") for log in drop_logs if log.get("label")}
    for label, _ in sorted(LABEL_PRIORITY.items(), key=lambda x: x[1]):
        if label in detected:
            return label

    return "no_meaning"

def classify_text(text, model, tokenizer):
    """
    텍스트를 분류 모델에 넣어 (예측 라벨, 확률 딕셔너리) 반환
    """
    model.eval()
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1).squeeze().tolist()

    id2label = model.config.id2label
    pred_idx = torch.argmax(logits).item()
    pred_label = id2label[pred_idx]
    prob_dict = {id2label[i]: float(p) for i, p in enumerate(probs)}
    return pred_label, prob_dict

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

    # 최종 라벨 결정 (우선순위 반영)
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
