import os
import json
import requests
from typing import List
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer

from app.models import UserSetting
from app.utils.es import get_es
from app.adapters.redis_io import append_conversation  # 표준: (room_id, role, content)

# ===============================
# ENV / 상수
# ===============================
REDIS_TTL_SEC = int(os.getenv("REDIS_TTL_SEC", "3600"))  # 유지: 다른 레이어에서 TTL 사용 시 참고
EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_PATH", "/app/models/embedding")
USER_MEMORY_EMBED_INDEX = os.getenv("USER_MEMORY_EMBED_INDEX", "user_memory_embedding")

GMS_API_KEY = os.getenv("GMS_API_KEY")
GMS_API_URL = os.getenv("GMS_API_URL")
GMS_MODEL_NAME = os.getenv("GMS_MODEL_NAME", "gpt-4o-mini")
GMS_TIMEOUT = float(os.getenv("GMS_TIMEOUT_SEC", "30"))

KNN_TOP_K = int(os.getenv("KNN_TOP_K", "3"))
KNN_MIN_SCORE = float(os.getenv("KNN_MIN_SCORE", "0.7"))
KNN_NUM_CANDIDATES = int(os.getenv("KNN_NUM_CANDIDATES", "100"))

# ===============================
# 임베딩 모델 (지연 로딩)
# ===============================
_embedder = None
def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL_PATH)
    return _embedder

# ===============================
# System Prompt 생성
# ===============================
def build_system_prompt(session: Session, user_id: str) -> str:
    setting = session.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if not setting:
        return "You are a helpful assistant that replies in Korean.\n- 답변은 반드시 마크다운 형식으로 작성하세요."

    tone_map = {
        "NEUTRAL": "일반적인 AI 스타일 🧠",
        "FRIENDLY": "다정하고 따뜻한 느낌, 이모지도 사용 😊",
        "POLITE": "공손하고 격식 있는 존댓말 위주 💼",
        "CHEERFUL": "활기차고 명랑한 말투, 가벼운 농담도 가능 😄",
        "CYNICAL": "냉소적이고 까칠한 말투",
        "CALM": "침착하고 담백한 표현, 감정 표현 최소 🌙",
    }

    parts = ["You are a Korean AI assistant.", "답변은 반드시 마크다운 형식으로 작성하세요."]
    if setting.call_me:
        parts.append(f'사용자를 "{setting.call_me}"이라고 부르세요.')
    if setting.role_description:
        parts.append(f"역할: {setting.role_description}")
    if setting.preferred_tone:
        tone_desc = tone_map.get(setting.preferred_tone, "")
        parts.append(f"응답 톤: {setting.preferred_tone} ({tone_desc})")
    if setting.traits:
        parts.append(f"성격/특징: {setting.traits}")
    if setting.additional_context:
        parts.append(f"추가 맥락: {setting.additional_context}")

    return "\n- ".join(parts)

# ===============================
# ES 유사 맥락 검색 (KNN + 사용자 필터)
# ===============================
def _safe_join_lines(lines: List) -> str:
    out = []
    for x in (lines or []):
        if isinstance(x, str):
            out.append(x)
        else:
            out.append(json.dumps(x, ensure_ascii=False))
    return "\n".join(out)

def search_similar_context_es(query: str, user_id: str, top_k: int = KNN_TOP_K, min_score: float = KNN_MIN_SCORE):
    es = get_es()
    emb = get_embedder().encode(query).tolist()

    # ES 8.x/OpenSearch의 KNN 검색은 filter를 함께 줄 수 있음
    body = {
        "knn": {
            "field": "embedding",
            "query_vector": emb,
            "k": top_k,
            "num_candidates": KNN_NUM_CANDIDATES,
            "filter": {
                "term": { "user_seq": user_id }   # 인덱스의 필드명이 user_seq인 경우
            }
        },
        "_source": ["content", "user_seq", "trace_id", "created_at"]
    }

    resp = es.search(index=USER_MEMORY_EMBED_INDEX, body=body)
    hits = resp.get("hits", {}).get("hits", []) or []

    results = []
    for h in hits:
        score = h.get("_score", 0.0)
        if score is None or score < min_score:
            continue
        src = h.get("_source") or {}
        content = src.get("content")
        if content:
            results.append(content)
    return results

# ===============================
# GPT 호출 + Redis 저장
# ===============================
def process_user_message(session: Session, payload):
    """
    1) System prompt 불러오기
    2) Redis 최근 대화 로드 (adapters.redis_io에서 turn 단위 저장/로드 사용 권장)
    3) ES 유사 맥락 검색 (동일 사용자 필터)
    4) GMS API 호출
    5) Redis 저장 (user/assistant 각 1턴씩)
    """
    if not GMS_API_URL or not GMS_API_KEY:
        raise RuntimeError("GMS_API_URL/GMS_API_KEY 환경변수가 설정되지 않았습니다.")

    # 1. System prompt
    system_prompt = build_system_prompt(session, payload.user_id)

    # 2. Redis 최근 대화: adapters.redis_io 쪽의 getter를 쓰는 것이 이상적이지만,
    #    여기서는 최소 메시지 크기를 위해 최근 N턴만 불러온다고 가정.
    #    get_conversation(room_id, limit) 형태의 유틸이 있다면 그걸 쓰는 것을 권장.
    try:
        from app.adapters.redis_io import get_conversation  # 표준 시그니처 가정: (room_id, limit)
        history = get_conversation(payload.room_id, limit=5) or []
    except Exception:
        # 안전망: 히스토리를 비워서 진행
        history = []

    # 3. ES 유사 맥락 (동일 사용자 필터)
    similar_contexts = []
    try:
        similar_contexts = search_similar_context_es(payload.text, user_id=payload.user_id, top_k=KNN_TOP_K)
    except Exception:
        # ES 장애 시에도 본 로직은 진행
        similar_contexts = []

    # 4. 최종 메시지 구성 (OpenAI 스타일)
    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        # h는 {"role": "...", "content": "..."} 포맷이라고 가정
        role = h.get("role")
        content = h.get("content")
        if role and content:
            messages.append({"role": role, "content": content})

    if similar_contexts:
        context_str = _safe_join_lines(similar_contexts)
        messages.append({"role": "system", "content": f"참고할 추가 맥락:\n{context_str}"})

    messages.append({"role": "user", "content": payload.text})

    # 5. GMS API 호출
    headers = {"Authorization": f"Bearer {GMS_API_KEY}"}
    req_json = {"model": GMS_MODEL_NAME, "messages": messages}

    try:
        response = requests.post(GMS_API_URL, headers=headers, json=req_json, timeout=GMS_TIMEOUT)
        response.raise_for_status()
        j = response.json()
        assistant_output = j["choices"][0]["message"]["content"]
    except (requests.RequestException, KeyError, IndexError) as e:
        raise Exception(f"GMS API error: {getattr(e, 'response', None) and getattr(e.response, 'text', '') or str(e)}")

    # 6. Redis에 저장 (턴 분리: user → assistant)
    append_conversation(payload.room_id, "user", payload.text)
    append_conversation(payload.room_id, "assistant", assistant_output)

    return assistant_output
