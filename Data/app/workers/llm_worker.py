import os
import time
import json
import logging
from datetime import datetime, timezone

from app.models import RoomSummaryState, PromptBuilt, TokenUsage
from app.adapters.kafka_io import make_consumer, make_producer, publish, read_headers
from app.utils.trace import extract_traceparent
from app.adapters.db import get_session
from app.services import prompt_builder_service, llm_client, error_service
from app.adapters.redis_io import append_conversation
from app.utils.usage import estimate_usage_by_tokens


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("llm-worker")

KAFKA_IN = os.getenv("KAFKA_TOPIC_IN_LLM", "chat.filter.result.v1")
KAFKA_OUT_DELTA = os.getenv("KAFKA_TOPIC_OUT_LLM_DELTA", "chat.llm.answer.delta.v1")
KAFKA_OUT_DONE = os.getenv("KAFKA_TOPIC_OUT_LLM_DONE", "chat.llm.answer.done.v1")


def log_llm_process(user_input: str, system_prompt: str, context_snippets: list, similar_contexts: list, full_text: str = None, usage: dict = None):
    try:
        lines = []
        lines.append("🤖 [LLM 처리 과정 요약]")

        lines.append(f"  📝 유저 입력: \"{user_input}\"")

        lines.append("  ⚙️ System Prompt:")
        for sp_line in system_prompt.splitlines():
            lines.append(f"    {sp_line}")

        if context_snippets:
            lines.append("  💬 최근 대화 맥락:")
            for i, ctx in enumerate(context_snippets, 1):
                lines.append(f"    {i}) {ctx}")
        else:
            lines.append("  💬 최근 대화 맥락 없음")

        if similar_contexts:
            lines.append("  🔍 유사 맥락(ES):")
            for i, ctx in enumerate(similar_contexts, 1):
                lines.append(f"    {i}) {ctx}")
        else:
            lines.append("  🔍 유사 맥락 없음")

        if full_text is not None:
            lines.append(f"  ✅ LLM 최종 답변: {full_text[:100]}{'...' if len(full_text) > 100 else ''}")

        if usage:
            lines.append(f"  📊 토큰 사용량: prompt={usage.get('prompt_tokens', 0)}, completion={usage.get('completion_tokens', 0)}, total={usage.get('total_tokens', 0)}")

        logger.info("\n" + "\n".join(lines))

    except Exception as e:
        logger.warning("⚠️ 로그 요약 중 오류: %s", e)


def run_worker():
    #logger.info("🚀 Starting LLM worker. Subscribing to %s", KAFKA_IN)
    consumer = make_consumer([KAFKA_IN], group_id="llm-worker")
    producer = make_producer()
    #logger.info("✅ Kafka consumer/producer ready.")

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            #logger.error("❌ Kafka error: %s", msg.error())
            continue

        try:
            ev = json.loads(msg.value().decode("utf-8"))
            #logger.info("📩 Received event: %s", ev)
        except Exception as e:
            #logger.error("❌ Failed to decode Kafka message: %s", e)
            continue

        headers_dict = read_headers(msg)
        tp = extract_traceparent(headers_dict)

        decision = ev.get("decision") or {}
        action = decision.get("action") or ev.get("action")
        if action != "PASS":
            logger.info("⏩ Skipping message (action=%s)", action)
            continue
