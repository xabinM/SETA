from pydantic import BaseModel
from typing import List

class EmbedStoreIn(BaseModel):
    user_id: str
    source_id: str
    text: str

class EmbedStoreOut(BaseModel):
    status: str
    embedding_id: str

class EmbedSearchOutItem(BaseModel):
    source_id: str
    content: str
    score: float

class EmbedSearchOut(BaseModel):
    status: str
    hits: List[EmbedSearchOutItem]
