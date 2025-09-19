from sqlalchemy.orm import Session
from app.models import ChatMessage, UserSetting
from app.adapters.es import get_es_client
from sentence_transformers import SentenceTransformer
import os

# 서버 임베딩 모델 로딩 (한 번만)
EMBED_MODEL_PATH = os.getenv("EMBED_MODEL_DIR", "/app/models/embedding")
embedder = SentenceTransformer(EMBED_MODEL_PATH)

def get_context(session: Session, room_id: str, limit: int = 5):
    """
    최근 대화 맥락 가져오기 (chat_message 기반)
    """
    msgs = (
        session.query(ChatMessage)
        .filter(ChatMessage.chat_room_id == room_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )
    snippets = []
    for m in reversed(msgs):
        role = "유저" if m.role == "user" else "어시스턴트"
        snippets.append(f"{role}: {m.content}")
    return snippets


def build_system_prompt(session: Session, user_id: str) -> str:
    """
    user_setting 기반으로 system_prompt 구성
    """
    setting = session.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if not setting:
        return "You are a helpful assistant that replies in Korean."

    tone_map = {
        "neutral": "일반적인 AI 스타일 🧠",
        "friendly": "다정하고 따뜻한 느낌, 이모지도 사용 😊",
        "polite": "공손하고 격식 있는 존댓말 위주 💼",
        "cheerful": "활기차고 명랑한 말투, 가벼운 농담도 가능 😄",
        "calm": "침착하고 담백한 표현, 감정 표현 최소 🌙",
    }

    parts = ["You are a Korean AI assistant."]
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


def search_similar_context_es(query: str, top_k: int = 3):
    """
    ES room-summary 인덱스에서 유사 요약 검색
    (임베딩은 서버의 Sentence-BERT 모델 사용)
    """
    es = get_es_client()

    # 1. 쿼리 → 벡터 임베딩
    emb = embedder.encode(query).tolist()

    # 2. ES 벡터 검색
    body = {
        "knn": {
            "field": "embedding_vector",
            "query_vector": emb,
            "k": top_k,
            "num_candidates": 100
        }
    }
    resp = es.search(index="room-summary", body=body)
    hits = resp["hits"]["hits"]
    return [hit["_source"]["summary_text"] for hit in hits]
