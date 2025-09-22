import os
import requests
from sqlalchemy.orm import Session
from app.services import prompt_builder_service as prompt_builder
from app.contracts.raw_filtered import RawFilteredMessage


GMS_API_KEY = os.getenv("GMS_API_KEY")
GMS_API_URL = os.getenv("GMS_API_URL")  


def build_prompt(session: Session, user_id: str, room_id: str, user_message: str):
    """
    System Prompt + Redis 대화 + ES 유사 맥락을 합쳐 최종 Prompt 생성
    """
    system_prompt = prompt_builder.build_system_prompt(session, user_id)
    recent_msgs = prompt_builder.get_recent_conversation(room_id, limit=5)
    similar_contexts = prompt_builder.search_similar_context_es(user_message, top_k=3, threshold=0.7)

    messages = []
    # (1) 시스템 프롬프트
    messages.append({"role": "system", "content": system_prompt})

    # (2) Redis 대화 맥락
    for msg in recent_msgs:
        messages.append(msg)

    # (3) ES 유사 맥락
    if similar_contexts:
        ctx_text = "\n".join(similar_contexts)
        messages.append({"role": "system", "content": f"참고할 추가 맥락:\n{ctx_text}"})

    # (4) 이번 사용자 입력
    messages.append({"role": "user", "content": user_message})

    return messages


def call_gpt(messages: list):
    """
    GMS API 호출 (ChatCompletion)
    """
    headers = {"Authorization": f"Bearer {GMS_API_KEY}"}
    payload = {
        "model": "gpt-4o",  # GMS에서 지정된 모델명
        "messages": messages,
        "temperature": 0.7,
    }

    resp = requests.post(GMS_API_URL, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    return data["choices"][0]["message"]["content"]


def process_user_message(session: Session, raw: RawFilteredMessage):
    """
    전체 흐름:
    1. Prompt 빌드
    2. GPT 호출
    3. Redis에 user/assistant 메시지 저장
    """
    user_id = raw.user_id
    room_id = raw.room_id
    user_message = raw.text

    # (1) 프롬프트 빌드
    messages = build_prompt(session, user_id, room_id, user_message)

    # (2) GPT 호출
    assistant_reply = call_gpt(messages)

    # (3) Redis 저장
    prompt_builder.append_conversation(room_id, user_message, assistant_reply)

    return assistant_reply
