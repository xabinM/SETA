# app/pipeline/filter_engine.py
from dataclasses import dataclass
from typing import List, Optional, Literal, Dict, Any

Reason = Literal[
    "thank","apology","goodbye","greeting",
    "call_only","reaction_only","no_meaning","connector_filler"
]

@dataclass
class FillerRemovalResult:
    cleaned_text: str
    detected_phrases: List[str]

@dataclass
class IntentDecision:
    action: Literal["PASS","DROP"]
    score: float
    threshold: float
    reason_type: Optional[Reason] = None
    reason_text: Optional[str] = None
    explanations: Optional[List[str]] = None
    cleaned_text: Optional[str] = None
    drop_logs: Optional[List[Dict[str, Any]]] = None

    def to_dict(self):
        return {
            "action": self.action,
            "score": self.score,
            "threshold": self.threshold,
            "reason_type": self.reason_type,
            "reason_text": self.reason_text,
            "explanations": self.explanations or [],
            "cleaned_text": self.cleaned_text,
            "drop_logs": self.drop_logs or [],
        }


class FilterEngine:
    def filler_removal(self, text: str) -> FillerRemovalResult: ...
    def intent_classifier(self, original: str, cleaned: str) -> IntentDecision: ...
