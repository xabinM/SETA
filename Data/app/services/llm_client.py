import openai
import os

def call_llm(model: str, prompt: str, temperature: float = 0.7):
    """
    LLM 호출 (OpenAI 예시)
    """
    resp = openai.ChatCompletion.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
    )
    text = resp.choices[0].message["content"]

    usage = {
        "prompt_tokens": resp.usage.prompt_tokens,
        "completion_tokens": resp.usage.completion_tokens,
        "total_tokens": resp.usage.total_tokens,
        "cost_usd": (resp.usage.total_tokens / 1000) * 0.002,  # 단가 예시
        "energy_wh": resp.usage.total_tokens * 0.001,  # 예시 값
        "co2_g": resp.usage.total_tokens * 0.0005,     # 예시 값
    }

    return text, usage
