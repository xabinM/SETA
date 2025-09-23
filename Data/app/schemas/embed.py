from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


# ===== 요청/응답 스키마 =====

class EmbedStoreIn(BaseModel):
    user_id: str
    source_id: str
    text: str


class EmbedStoreOut(BaseModel):
    status: str
    embedding_id: str


class EmbedSearchOutItem(BaseModel):
    embedding_id: str
    user_id: str
    source_id: str
    content: str
    score: float
    created_at: Optional[datetime]


class EmbedSearchOut(BaseModel):
    status: str
    hits: List[EmbedSearchOutItem]
