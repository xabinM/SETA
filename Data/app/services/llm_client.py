from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("GMS_KEY"),
    base_url=os.getenv("GMS_URL", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")
)

def call_llm(prompt, stream=True, model="gpt-4o", temperature=0.7):
    messages = [
        {"role": "system", "content": "답변은 반드시 마크다운 형식으로 작성하세요."},
        {"role": "user", "content": prompt}
    ]

    if stream:
        # 스트리밍 제너레이터
        stream_resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        for chunk in stream_resp:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    else:
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature
        )
        return resp.choices[0].message.content
