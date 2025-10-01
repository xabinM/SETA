from sqlalchemy import (
    Column, String, Integer, Float, Text, TIMESTAMP,
    ForeignKey, Numeric, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid
import enum
from sqlalchemy import Column, DateTime

Base = declarative_base()

class PreferredToneEnum(enum.Enum):
    NEUTRAL = "NEUTRAL"
    FRIENDLY = "FRIENDLY"
    POLITE = "POLITE"
    CHEERFUL = "CHEERFUL"
    CYNICAL = "CYNICAL"
    CALM = "CALM"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True)
    name = Column(String(255))
    password = Column(String(255))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_message"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_room_id = Column(UUID(as_uuid=True), ForeignKey("chat_room.chat_room_id"))
    author_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    role = Column(String(16))  # user / assistant / system
    content = Column(Text)
    filtered_content = Column(Text)
    external_id = Column(String(64))
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    turn_index = Column(Integer)


class ChatRoom(Base):
    __tablename__ = "chat_room"

    chat_room_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Integer, ForeignKey("users.user_id"))
    title = Column(String(255))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class PromptBuilt(Base):
    __tablename__ = "prompt_built"

    trace_id = Column(String(64), primary_key=True)
    built_prompt = Column(Text)
    context_messages = Column(JSONB)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


class UserSetting(Base):
    __tablename__ = "user_setting"

    user_setting_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    call_me = Column(String(64))
    role_description = Column(Text)
    preferred_tone = Column(SAEnum(PreferredToneEnum, name="preferred_tone_enum"))
    traits = Column(Text)
    additional_context = Column(Text)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class LlmResponse(Base):
    __tablename__ = "llm_response"

    trace_id = Column(String(64), primary_key=True)
    model_name = Column(String(64))
    temperature = Column(Float)
    top_p = Column(Float)
    response_text = Column(Text)
    response_tokens = Column(Integer)
    latency_ms = Column(Integer)
    total_cost_usd = Column(Numeric(14, 6))
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_message.message_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    prompt_tokens = Column(Integer)
    completion_tokens = Column(Integer)
    total_tokens = Column(Integer)
    cost_usd = Column(Numeric(14, 6))
    energy_wh = Column(Numeric(14, 6))
    co2_g = Column(Numeric(14, 6))
    saved_tokens = Column(Integer)
    saved_cost_usd = Column(Numeric(14, 6))
    saved_energy_wh = Column(Numeric(14, 6))
    saved_co2_g = Column(Numeric(14, 6))
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


class FilterResult(Base):
    __tablename__ = "filter_result"

    filter_id = Column(Integer, primary_key=True, autoincrement=True)
    chat_room_id = Column(UUID(as_uuid=True), ForeignKey("chat_room.chat_room_id"))
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_message.message_id"))
    stage = Column(String(16))   # rule / ml
    action = Column(String(8))   # PASS / DROP
    rule_name = Column(String(64))
    score = Column(Numeric(5, 3))
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    trace_id = Column(String(64), index=True)  # 연동/조회 자주 하므로 index

class RoomSummaryState(Base):
    __tablename__ = "room_summary_state"

    chat_room_id = Column(UUID(as_uuid=True), ForeignKey("chat_room.chat_room_id"), primary_key=True)
    last_turn_end = Column(Integer, nullable=False, default=0)
    last_summary_at = Column(DateTime(timezone=True))
    unsummarized_count = Column(Integer, nullable=False, default=0)

    chat_room = relationship("ChatRoom", backref="summary_state")

class ErrorLog(Base):
    __tablename__ = "error_log"

    trace_id = Column(String(64), primary_key=True)
    error_type = Column(String(32))
    error_message = Column(Text)
    stack_trace = Column(Text)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
