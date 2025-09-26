import torch
from typing import Dict, Any, List, Optional

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
    "meaningful": 0.00,  # 의미 있는 건 drop 안 함
}

# === 라벨 우선순위 (낮을수록 우선) ===
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

# === 조사 세트 ===
KOREAN_PARTICLES = {"은", "는", "이", "가", "를", "을", "이야", '나', "두", "도", "에", "게", "만", "까지", "이다", "의", "에서", "서"}

def token_has_particle(token: str) -> bool:
    """토큰이 조사(은/는/이/가/를/을)로 끝나면 True"""
    return any(token.endswith(p) for p in KOREAN_PARTICLES)


def resolve_final_label(drop_logs: List[Dict[str, Any]]) -> Optional[str]:
    """드랍 로그들에서 최종 라벨 선택 (우선순위 반영)"""
    if not drop_logs:
        return None
    detected = {log.get("label") for log in drop_logs if log.get("label")}
    for label, _ in sorted(LABEL_PRIORITY.items(), key=lambda x: x[1]):
        if label in detected:
            return label
    return "no_meaning"


def classify_text(text: str, model, tokenizer):
    """모델로 텍스트 분류"""
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
    """
    1) 문장 분리
    2) 각 문장에서 앞 1~3gram 슬라이딩으로 prefix 필터 적용
       - 걸리면 해당 토큰만 제거하고 나머지 계속 검사
       - meaningful이면 강제 PASS
       - 조사 붙은 경우(drop_word+은/는/이/가/를)는 PASS
    3) 남은 tokens로 full-sentence 검사
    4) 최종적으로 남은 tokens만 kept_sentences에 반영
    5) drop_logs 기준으로 최종 라벨/스코어 결정
    """

    drop_logs: List[Dict[str, Any]] = []
    kept_sentences: List[str] = []

    # === 1. 문장 분리 (.?! 기준) ===
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

    # === 2. 각 문장 처리 ===
    for sent in sentences:
        tokens = sent.split()
        if not tokens:
            continue

        while tokens:
            matched_prefix = False

            # 2-1. 앞 1~3gram 검사
            for n in [1, 2, 3]:
                if len(tokens) < n:
                    continue
                prefix = " ".join(tokens[:n])
                pred, probs = classify_text(prefix, model, tokenizer)

                # meaningful → 문장 전체 PASS 확정
                if pred == "meaningful":
                    kept_sentences.append(" ".join(tokens))
                    tokens = []
                    matched_prefix = True
                    break

                top_score = probs[pred]
                use_th = LABEL_THRESHOLDS.get(pred, threshold)
                if pred in PREFIX_FILTER_LABELS and top_score >= use_th:
                    #  조사 예외: n==1 이고 조사 붙은 경우 → drop하지 않고 PASS
                    if n == 1 and token_has_particle(tokens[0]):
                        kept_sentences.append(" ".join(tokens))
                        tokens = []
                        matched_prefix = True
                        break

                    # 정상 drop
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
                continue  # 절단 후 남은 tokens 다시 검사

            # 2-2. 더 이상 prefix 매칭이 안 되면 full-sentence 검사
            remaining = " ".join(tokens)
            pred, probs = classify_text(remaining, model, tokenizer)

            if pred == "meaningful":
                kept_sentences.append(remaining)
                tokens = []
                break

            top_score = probs[pred]
            use_th = LABEL_THRESHOLDS.get(pred, threshold)
            if pred in FULL_FILTER_LABELS and top_score >= use_th:
                # full-sentence는 조사 예외 적용하지 않음
                drop_logs.append({
                    "원문": sent,
                    "단계": "full-sentence",
                    "label": pred,
                    "confidence": float(top_score),
                    "probs": probs
                })
                tokens = []  # 문장 전체 드랍
                break
            else:
                kept_sentences.append(remaining)
                tokens = []
                break

        # while 끝 → tokens 다 처리됨

    # === 3. 최종 라벨/스코어 결정 ===
    final_label = resolve_final_label(drop_logs)
    max_conf = max((log["confidence"] for log in drop_logs), default=0.0)

    if kept_sentences:
        # 아무것도 드랍 안 됐다면 label/score 비움
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
