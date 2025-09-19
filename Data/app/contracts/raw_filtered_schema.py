from pydantic import BaseModel, Field
from typing import Optional

class RawFilteredMessageSchema(BaseModel):
    """
    FastAPI용 Pydantic 스키마 (유효성 검사 + Swagger 문서화)
    Kafka RawFilteredMessage와 동일한 구조
    """

    trace_id: str = Field(..., description="요청 전체 추적용 고유 ID")
    room_id: str = Field(..., description="채팅방 ID")
    message_id: str = Field(..., description="메시지 ID")
    user_id: str = Field(..., description="사용자 ID (익명/해시 처리)")
    timestamp: int = Field(..., description="Unix epoch milliseconds")
    text: str = Field(..., description="원문 텍스트")
    final_text: Optional[str] = Field(None, description="Spark 1차 필터 후 텍스트 (없으면 원문 그대로)")
    schema_version: str = Field("1.0.0", description="스키마 버전")
    top_category: Optional[str] = Field(None, description="(선택) Spark에서 붙인 상위 카테고리")
    category_mask: Optional[str] = Field(None, description="(선택) Spark에서 붙인 라벨 마스크")
    mode: str = Field("pass", description="auto=룰 기반 DROP / pass=ML 필터링")

    class Config:
        schema_extra = {
            "example": {
                "trace_id": "t-2",
                "room_id": "room-123",
                "message_id": "msg-002",
                "user_id": "user-xyz",
                "timestamp": 1751480767890,
                "text": "오늘 일정 알려줘",
                "final_text": "오늘 일정 알려줘",
                "schema_version": "1.0.0",
                "mode": "pass"
            }
        }
