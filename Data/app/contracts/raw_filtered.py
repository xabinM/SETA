from dataclasses import dataclass
from typing import Optional

@dataclass
class RawFilteredMessage:
    
    """
    Spark에서 필터링된 메시지를 Kafka로 발행하면,
    Filter Worker가 소비해서 DB/ES에 저장하는 계약 스키마.
    """

    trace_id: str        # 하나의 요청 전체를 추적하는 고유 ID
    room_id: str         # 채팅방 ID
    message_id: str      # 메시지 ID
    user_id: str         # 사용자 ID (익명/해시 처리)
    timestamp: int       # epoch milliseconds
    text: str            # 원문 텍스트
    final_text: Optional[str]  # 1차 룰/정규화 후 텍스트 (없으면 원문 그대로)
    schema_version: str  # 스키마 버전 (예: "1.0.0")
    top_category: Optional[str] = None   # (선택) Spark에서 붙일 수 있는 상위 카테고리
    category_mask: Optional[str] = None  # (선택) Spark에서 붙일 수 있는 라벨 마스크
    mode: str = "pass"   # "auto" (Spark에서 바로 DROP) | "pass" (Worker에서 ML 분류)
