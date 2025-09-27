import os
import json
import redis
from datetime import timedelta
from sqlalchemy.orm import Session
from app.models import UserSetting
from app.utils.es import get_es
from sentence_transformers import SentenceTransformer

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_TTL_SEC = int(os.getenv("REDIS_TTL_SEC", "3600"))  # 1시간 기본

r = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_PATH", "/app/models/embedding")
embedder = SentenceTransformer(EMBED_MODEL_PATH)


def append_conversation(room_id: str, user_input: str, assistant_output: str, max_turns: int = 5):

    key = f"chat:{room_id}:messages"
    history_json = r.get(key)
    history = json.loads(history_json) if history_json else []

    # 새로운 대화 추가
    if user_input:
        history.append({"role": "user", "content": user_input})
    if assistant_output:
        history.append({"role": "assistant", "content": assistant_output})

    # 최근 max_turns * 2개 메시지만 유지 (user+assistant 쌍)
    if len(history) > max_turns * 2:
        history = history[-max_turns * 2 :]

    r.setex(key, REDIS_TTL_SEC, json.dumps(history, ensure_ascii=False))


def get_recent_conversation(room_id: str, limit: int = 5):

    key = f"chat:{room_id}:messages"
    history_json = r.get(key)
    if not history_json:
        return []
    history = json.loads(history_json)
    return history[-limit * 2 :]  # 최근 limit턴만 반환



def build_system_prompt(session: Session, user_id: str) -> str:
    setting = session.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if not setting:
        return "You are a helpful assistant that replies in Korean."

    tone_map = {
        "NEUTRAL": "일반적인 AI 스타일 🧠",
        "FRIENDLY": "다정하고 따뜻한 느낌, 이모지도 사용 😊",
        "POLITE": "공손하고 격식 있는 존댓말 위주 💼",
        "CHEERFUL": "활기차고 명랑한 말투, 가벼운 농담도 가능 😄",
        "CYNICAL": "냉소적이고 까칠한 말투",
        "CALM": "침착하고 담백한 표현, 감정 표현 최소 🌙",
    }

    parts = ["당신은 한국 AI 어시스턴트 입니다."]

    if setting.call_me:
        parts.append(f'사용자를 "{setting.call_me}"이라고 부르세요.')
    if setting.role_description:
        parts.append(f"역할: {setting.role_description}")
    if setting.preferred_tone:
        tone_key = getattr(setting.preferred_tone, "name", str(setting.preferred_tone))
        tone_desc = tone_map.get(tone_key, "")
        parts.append(f"응답 톤: {tone_key} ({tone_desc})")
    if setting.traits:
        parts.append(f"성격/특징: {setting.traits}")
    if setting.additional_context:
        parts.append(f"추가 맥락: {setting.additional_context}")

    return "\n- ".join(parts)



def search_similar_context_es(query: str, user_id: str, top_k: int = 3, min_score: float = 0.7):
    es = get_es()
    emb = embedder.encode(query).tolist()

    body = {
        "knn": {
            "field": "embedding",
            "query_vector": emb,
            "k": top_k,
            "num_candidates": 100,
        },
        "_source": ["content", "user_id", "created_at"],
    }

    if user_id:
        body["knn"]["filter"] = {"term": {"user_id": user_id}}

    resp = es.search(index="user_memory_embedding", body=body)

    results = []
    for hit in resp["hits"]["hits"]:
        score = hit.get("_score", 0.0)
        if score >= min_score:
            results.append({
                "text": hit["_source"]["content"],
                "score": score,
            })
    return results

