# app/contracts/filter_event.py
from typing import Optional, Dict, Literal
from pydantic import BaseModel, Field

class FilterEvent(BaseModel):
    trace_id: str
    room_id: str
    message_id: str
    user_id: str
    action: Literal["PASS", "DROP"]
    rule: Literal["ml"] = "ml"
    cleaned_text: Optional[str] = None
    label: Optional[str] = None   # drop 사유 reason_type
    score: float = 1.0
    meta: Dict = Field(default_factory=dict)
    schema_version: str = "1.0.0"
