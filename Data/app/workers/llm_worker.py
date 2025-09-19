import os
import time
from datetime import datetime, timezone
from app.adapters.kafka_io import make_consumer, make_producer, publish
from app.adapters.db import get_session
from app.models import LlmResponse, TokenUsage, ChatMessage
from app.services.llm_client import call_llm
from sqlalchemy.orm import Session
from app.adapters.redis_io import append_conversation 

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_LLM", "chat.prompt.built.v1")
KAFKA_OUT = os.getenv("KAFKA_TOPIC_OUT_LLM", "chat.llm.answer.v1")

def run_worker():
    consumer = make_consumer(KAFKA_IN, group_id="llm-worker")
    producer = make_producer()

    for msg in consumer:
        data = msg.value  # PromptBuiltV1
        trace_id = data["trace_id"]
        room_id = data["room_id"]
        message_id = data["message_id"]
        prompt = data["prompt"]["full_prompt"]
        user_input = data["prompt"].get("user_input") 

        # === LLM 호출 ===
        start = time.time()
        model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))

        response_text, usage = call_llm(
            model=model_name,
            prompt=prompt,
            temperature=temperature
        )
        latency_ms = int((time.time() - start) * 1000)

        with get_session() as session:
            # 1) llm_response 저장
            llm_res = LlmResponse(
                trace_id=trace_id,
                model_name=model_name,
                temperature=temperature,
                top_p=1.0,
                response_text=response_text,
                response_tokens=usage["completion_tokens"],
                latency_ms=latency_ms,
                total_cost_usd=usage["cost_usd"],
                created_at=datetime.now(timezone.utc),
            )
            session.add(llm_res)

            # 2) token_usage 저장
            token_usage = TokenUsage(
                message_id=message_id,
                prompt_tokens=usage["prompt_tokens"],
                completion_tokens=usage["completion_tokens"],
                total_tokens=usage["total_tokens"],
                cost_usd=usage["cost_usd"],
                energy_wh=usage["energy_wh"],
                co2_g=usage["co2_g"],
                saved_tokens=usage.get("saved_tokens", 0),
                saved_cost_usd=usage.get("saved_cost_usd", 0),
                saved_energy_wh=usage.get("saved_energy_wh", 0),
                saved_co2_g=usage.get("saved_co2_g", 0),
                user_id=data.get("user_id"),
                created_at=datetime.now(timezone.utc),
            )
            session.add(token_usage)

            # 3) chat_message (assistant 응답) 저장
            cm = ChatMessage(
                message_id=os.urandom(16).hex(),
                chat_room_id=room_id,
                author_id=None,
                role="assistant",
                content=response_text,
                filtered_content=response_text,
                external_id=trace_id,
                created_at=datetime.now(timezone.utc),
            )
            session.add(cm)

            session.commit()

        # === Redis Append ===
        append_conversation(
            room_id=room_id,
            user_input=user_input,
            assistant_output=response_text
        )

        # === Kafka OUT ===
        event = {
            "trace_id": trace_id,
            "room_id": room_id,
            "message_id": message_id,
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
            "llm": {
                "model": model_name,
                "temperature": temperature
            },
            "latency_ms": latency_ms,
            "response": {"text": response_text},
            "token_usage": usage,
            "cost_estimate": {
                "currency": "USD",
                "value": usage["cost_usd"]
            },
            "schema_version": "1.0.0"
        }
        publish(producer, KAFKA_OUT, key=room_id, value=event)
