import os
import json
import redis

# 환경 변수 기반 설정
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_TTL_SEC = int(os.getenv("REDIS_TTL_SEC", "3600"))  # 기본 1시간 TTL

r = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)


def append_conversation(room_id: str, role: str, content: str, max_turns: int = 5):
    """
    Redis에 대화 저장 (최근 max_turns 유지)
    기존 구조(chat:{room_id}:messages)를 유지하면서 user/assistant 모두 append.
    """
    key = f"chat:{room_id}:messages"
    history_json = r.get(key)
    if history_json:
        history = json.loads(history_json)
    else:
        history = []

    # 새 대화 추가
    if content:
        history.append({"role": role, "content": content})

    # 최근 max_turns * 2개 메시지만 유지 (user+assistant 쌍)
    if len(history) > max_turns * 2:
        history = history[-max_turns * 2:]

    # TTL 포함 저장
    r.setex(key, REDIS_TTL_SEC, json.dumps(history, ensure_ascii=False))


def get_conversation(room_id: str, limit: int | None = None):
    key = f"chat:{room_id}:messages"
    history_json = r.get(key)
    history = json.loads(history_json) if history_json else []
    return history[-limit:] if (limit and limit > 0) else history