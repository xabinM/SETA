import os
from app.services import llm_client

MODEL_NAME = os.getenv("SUMMARY_MODEL", "gpt-4o-mini")
TEMPERATURE = float(os.getenv("SUMMARY_TEMPERATURE", "0.3"))

def summarize(text_block: str) -> str:

    prompt = (
        "다음 대화를 핵심 내용을 모두 포함해서 프롬프트의 길이에 따라 적절하게 요약하세요. 내용이 적을 시 최소 1줄에서 내용이 많을 시 최대 10줄 내외로 요약하세요.\n"
        "핵심 사건, 유저 의도, 시스템 응답을 포함하세요.\n\n"
        f"{text_block}"
    )

    result = llm_client.simple_completion(MODEL_NAME, prompt, TEMPERATURE)

    return result.strip()
