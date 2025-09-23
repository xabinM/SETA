from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("GMS_API_KEY"),
    base_url=os.getenv("GMS_API_URL", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")
)

def call_llm(prompt, stream=True, model="gpt-4o", temperature=0.7):
    messages = [
        {"role": "system", "content": "답변은 반드시 마크다운 형식으로 작성하세요."},
        {"role": "user", "content": prompt}
    ]

    if stream:
        stream_resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        for chunk in stream_resp:
            if chunk.choices[0].delta.content:
                yield {"type": "delta", "delta": chunk.choices[0].delta.content}
        yield {"type": "done", "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}}
    else:
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=False,
        )
        return resp.choices[0].message.content



def simple_completion(model: str, prompt: str, temperature: float = 0.3) -> str:
    """
    스트리밍 없이 한 번에 LLM 호출해서 텍스트만 반환
    """
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": "너는 대화를 요약하는 어시스턴트야."},
                  {"role": "user", "content": prompt}],
        temperature=temperature,
        stream=False,
    )
    return resp.choices[0].message.content
