import os
import json
import redis
from datetime import timedelta

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_TTL_SEC = int(os.getenv("REDIS_TTL_SEC", "3600"))  # 1시간 기본

r = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

def append_conversation(room_id: str, user_input: str, assistant_output: str, max_turns: int = 20):
    """
    Redis에 대화 저장 (최근 N턴만 유지)
    """
    key = f"chat:{room_id}:messages"
    history_json = r.get(key)
    if history_json:
        history = json.loads(history_json)
    else:
        history = []

    # 새로운 대화 추가
    if user_input:
        history.append({"role": "user", "content": user_input})
    if assistant_output:
        history.append({"role": "assistant", "content": assistant_output})

    # 최근 max_turns * 2개 메시지만 유지 (user+assistant 쌍)
    if len(history) > max_turns * 2:
        history = history[-max_turns * 2:]

    r.setex(key, REDIS_TTL_SEC, json.dumps(history, ensure_ascii=False))
