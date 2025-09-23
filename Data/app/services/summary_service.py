import os
from app.services import llm_client

MODEL_NAME = os.getenv("SUMMARY_MODEL", "gpt-4o-mini")
TEMPERATURE = float(os.getenv("SUMMARY_TEMPERATURE", "0.3"))

def summarize(text_block: str) -> str:
    """
    대화 블록을 요약한다.
    - 입력: 원문 대화 텍스트
    - 출력: 3~5줄 내외의 요약 결과
    """
    prompt = (
        "다음 대화를 3~5줄 이내, 100~150자 내외로 요약하세요.\n"
        "핵심 사건, 유저 의도, 시스템 응답만 포함하고 세부 표현은 생략하세요.\n\n"
        f"{text_block}"
    )

    # llm_client에 'non-streaming' 방식 메소드가 있다고 가정
    result = llm_client.simple_completion(MODEL_NAME, prompt, TEMPERATURE)

    return result.strip()
