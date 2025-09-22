from app.pipelines.filter.filter_engine import IntentDecision

class MyFilterEngine:
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer

    def intent_classifier(self, original: str, cleaned: str) -> IntentDecision:
        from app.pipelines.filter.filter_classifier import filter_classifier
        result = filter_classifier(cleaned, self.model, self.tokenizer)

        return IntentDecision(
            action="PASS" if result["status"] == "pass" else "DROP",
            score=result["score"],
            threshold=0.8,
            reason_type=result["label"],
            reason_text=f"{result['label']} 사유로 필터링됨" if result["label"] else None,
            explanations=["BERT margin 분류기 결과"],
            cleaned_text=(result["content"] if result["status"] == "pass" else None),
            drop_logs=result.get("drop_logs")
        )

    def _make_auto_decision(self) -> IntentDecision:
        """Spark에서 mode=auto로 넘어온 경우, 무조건 DROP"""
        return IntentDecision(
            action="DROP",
            score=1.0,
            threshold=1.0,
            reason_type="rule",
            reason_text="Spark 1차 룰 필터링 결과",
            explanations=["Spark 룰 기반 필터링 결과"]
        )
