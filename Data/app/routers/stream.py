import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from confluent_kafka import Consumer
import os
import asyncio

from app.adapters.kafka_io import make_consumer

router = APIRouter()

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "3.35.206.91:29092")
TOPIC_DELTA = os.getenv("KAFKA_TOPIC_OUT_LLM_DELTA", "chat.llm.answer.delta.v1")
TOPIC_DONE = os.getenv("KAFKA_TOPIC_OUT_LLM_DONE", "chat.llm.answer.done.v1")


@router.get("/api/stream/{room_id}")
async def stream_events(room_id: str):
    """
    SSE endpoint for real-time LLM responses
    """
    consumer: Consumer = make_consumer(
        topics=[TOPIC_DELTA, TOPIC_DONE],
        group_id=f"sse-consumer-{room_id}",
        auto_offset_reset="latest",
    )

    async def event_generator():
        try:
            while True:
                msg = consumer.poll(1.0)
                if msg is None:
                    await asyncio.sleep(0.1)
                    continue
                if msg.error():
                    continue

                data = json.loads(msg.value())
                if data.get("room_id") != room_id:
                    continue

                if msg.topic() == TOPIC_DELTA:
                    yield f"data: {json.dumps({'type':'chunk','delta':data['delta']}, ensure_ascii=False)}\n\n"

                elif msg.topic() == TOPIC_DONE:
                    yield f"data: {json.dumps({'type':'done','usage':data.get('usage',{})}, ensure_ascii=False)}\n\n"
                    break  # end SSE after done
        finally:
            consumer.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
