import os
import tiktoken
from datetime import datetime, timezone
from app.adapters.kafka_io import make_consumer, make_producer, publish
from app.adapters.db import get_session
from app.models import ChatMessage, PromptBuilt, UserSetting
from sqlalchemy.orm import Session
from app.services import prompt_builder_service

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_PROMPT", "chat.filter.result.v1")
KAFKA_OUT = os.getenv("KAFKA_TOPIC_OUT_PROMPT", "chat.prompt.built.v1")

def run_worker():
    consumer = make_consumer(KAFKA_IN, group_id="prompt-builder")
    producer = make_producer()

    for msg in consumer:
        data = msg.value  # dict
        if data["action"] != "PASS":
            # DROP은 무시
            continue

        trace_id = data["trace_id"]
        room_id = data["room_id"]
        message_id = data["message_id"]
        user_input = data.get("cleaned_text") or ""

        with get_session() as session:
            # 1) system_prompt (user_setting 기반)
            system_prompt = prompt_builder_service.build_system_prompt(session, data["user_id"])

            # 2) 최근 대화 맥락 (chat_message)
            context_snippets = prompt_builder_service.get_context(session, room_id)

            # 3) ES에서 요약 검색 (query = 이번 user_input)
            similar_contexts = prompt_builder_service.search_similar_context_es(user_input, top_k=3)

            # 4) full_prompt 조립
            full_prompt = (
                f"System: {system_prompt}\n\n"
                + "\n".join(context_snippets)
                + ("\n\n[과거 요약]\n" + "\n".join(similar_contexts) if similar_contexts else "")
                + (f"\n\n유저: {user_input}" if user_input else "")
            )


            # 4) 토큰 추정치 계산
            enc = tiktoken.get_encoding("cl100k_base")
            input_tokens = len(enc.encode(full_prompt))

            # 5) DB 저장
            pb = PromptBuilt(
                trace_id=trace_id,
                built_prompt=full_prompt,
                context_messages=context_snippets,
                created_at=datetime.now(timezone.utc)
            )
            session.add(pb)
            session.commit()

        # 6) Kafka 발행
        event = {
            "trace_id": trace_id,
            "room_id": room_id,
            "message_id": message_id,
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
            "prompt": {
                "system": system_prompt,
                "context_snippets": context_snippets,
                "user_input": user_input,
                "full_prompt": full_prompt
            },
            "token_usage_estimate": {"input_tokens": input_tokens},
            "schema_version": "1.0.0"
        }
        publish(producer, KAFKA_OUT, key=room_id, value=event)
