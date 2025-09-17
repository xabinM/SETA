# app/schemas/embed.py
from pydantic import BaseModel, Field
from typing import List, Optional


class EmbedStoreIn(BaseModel):
    """
    텍스트 저장 요청용 스키마
    """
    user_seq: int = Field(..., description="사용자 ID")
    text: str = Field(..., description="저장할 원문 텍스트")


class EmbedStoreOut(BaseModel):
    """
    텍스트 저장 응답 스키마
    """
    status: str = Field("ok", description="처리 상태")
    trace_id: str = Field(..., description="저장된 문서의 추적 ID")


class EmbedSearchOutItem(BaseModel):
    """
    검색 결과 한 건
    """
    content: str
    score: float
    trace_id: Optional[str] = None


class EmbedSearchOut(BaseModel):
    """
    검색 응답 스키마
    """
    status: str = Field("ok", description="처리 상태")
    hits: List[EmbedSearchOutItem] = Field(default_factory=list)
