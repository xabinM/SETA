import os
import json
import redis
import requests
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer
from app.models import UserSetting
from app.adapters.es import get_es_client

# ===============================
# Redis 설정
# ===============================
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_TTL_SEC = int(os.getenv("REDIS_TTL_SEC", "3600"))  # 1시간 기본

r = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

# ===============================
# GPT API 설정 (GMS 프록시)
# ===============================
GMS_API_KEY = os.getenv("GMS_API_KEY")
GMS_API_URL = os.getenv("GMS_API_URL")

# ===============================
# 임베딩 모델 로딩
# ===============================
EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_DIR", "/app/models/embedding")
embedder = SentenceTransformer(EMBED_MODEL_PATH)

# ===============================
# Redis 대화 관리
# ===============================
def append_conversation(room_id: str, user_input: str, assistant_output: str, max_turns: int = 5):
    """
    Redis에 대화 저장 (최근 max_turns 쌍만 유지)
    """
    key = f"chat:{room_id}:messages"
    history_json = r.get(key)
    history = json.loads(history_json) if history_json else []

    if user_input:
        history.append({"role": "user", "content": user_input})
    if assistant_output:
        history.append({"role": "assistant", "content": assistant_output})

    if len(history) > max_turns * 2:
        history = history[-max_turns * 2 :]

    r.setex(key, REDIS_TTL_SEC, json.dumps(history, ensure_ascii=False))


def get_recent_conversation(room_id: str, limit: int = 5):
    """
    Redis에서 최근 대화 불러오기
    """
    key = f"chat:{room_id}:messages"
    history_json = r.get(key)
    if not history_json:
        return []
    history = json.loads(history_json)
    return history[-limit * 2 :]

# ===============================
# System Prompt 생성
# ===============================
def build_system_prompt(session: Session, user_id: str) -> str:
    setting = session.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if not setting:
        return "You are a helpful assistant that replies in Korean."

    tone_map = {
        "NEUTRAL": "일반적인 AI 스타일 🧠",
        "FRIENDLY": "다정하고 따뜻한 느낌, 이모지도 사용 😊",
        "POLITE": "공손하고 격식 있는 존댓말 위주 💼",
        "CHEERFUL": "활기차고 명랑한 말투, 가벼운 농담도 가능 😄",
        "CALM": "침착하고 담백한 표현, 감정 표현 최소 🌙",
    }

    parts = ["You are a Korean AI assistant."]
    if setting.call_me:
        parts.append(f'사용자를 "{setting.call_me}"이라고 부르세요.')
    if setting.role_description:
        parts.append(f"역할: {setting.role_description}")
    if setting.preferred_tone:
        tone_desc = tone_map.get(setting.preferred_tone.upper(), "")
        parts.append(f"응답 톤: {setting.preferred_tone} ({tone_desc})")
    if setting.traits:
        parts.append(f"성격/특징: {setting.traits}")
    if setting.additional_context:
        parts.append(f"추가 맥락: {setting.additional_context}")

    return "\n- ".join(parts)

# ===============================
# ES 유사 맥락 검색
# ===============================
def search_similar_context_es(query: str, user_seq: str, top_k: int = 3, min_score: float = 0.7):
    es = get_es_client()
    emb = embedder.encode(query).tolist()

    body = {
        "knn": {
            "field": "embedding",
            "query_vector": emb,
            "k": top_k,
            "num_candidates": 100
        },
        "_source": ["content", "user_seq", "trace_id", "created_at"]
    }
    resp = es.search(index="user_memory_embedding", body=body)

    results = []
    for hit in resp["hits"]["hits"]:
        if hit["_score"] >= min_score:
            results.append(hit["_source"]["content"])
    return results

# ===============================
# GPT 호출 + Redis 저장
# ===============================
def process_user_message(session: Session, payload):
    """
    1) System prompt 불러오기
    2) Redis 최근 대화 불러오기
    3) ES 유사 맥락 검색
    4) GPT API 호출
    5) Redis 저장
    """
    # 1. System prompt
    system_prompt = build_system_prompt(session, payload.user_id)

    # 2. Redis 최근 대화
    history = get_recent_conversation(payload.room_id, limit=5)

    # 3. ES 유사 맥락
    similar_contexts = search_similar_context_es(payload.text, user_seq=payload.user_id, top_k=3)

    # 4. 최종 메시지 구성
    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append(h)
    if similar_contexts:
        context_str = "\n".join(similar_contexts)
        messages.append({"role": "system", "content": f"참고할 추가 맥락:\n{context_str}"})
    messages.append({"role": "user", "content": payload.text})

    # 5. GPT API 호출
    headers = {"Authorization": f"Bearer {GMS_API_KEY}"}
    response = requests.post(
        GMS_API_URL,
        headers=headers,
        json={"model": "gpt-4o-mini", "messages": messages}
    )
    if response.status_code != 200:
        raise Exception(f"GMS API error: {response.text}")

    assistant_output = response.json()["choices"][0]["message"]["content"]

    # 6. Redis에 저장
    append_conversation(payload.room_id, payload.text, assistant_output, max_turns=5)

    return assistant_output
