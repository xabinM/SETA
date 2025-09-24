from openai import OpenAI
import os
import tiktoken

client = OpenAI(
    api_key=os.getenv("GMS_API_KEY"),
    base_url=os.getenv("GMS_API_URL", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")
)

def count_tokens(model: str, messages: list[str]) -> int:
    """tiktoken 기반 토큰 수 계산"""
    try:
        enc = tiktoken.encoding_for_model(model)
    except Exception:
        enc = tiktoken.get_encoding("cl100k_base")
    text = ""
    for m in messages:
        text += m["role"] + ": " + m["content"] + "\n"
    return len(enc.encode(text))

def call_llm(prompt, stream=True, model="gpt-4o", temperature=0.7):
    messages = [
        {"role": "user", "content": prompt}
    ]

    prompt_tokens = count_tokens(model, messages)
    completion_chunks = []

    if stream:
        stream_resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        for chunk in stream_resp:
            if chunk.choices[0].delta.content:
                delta = chunk.choices[0].delta.content
                completion_chunks.append(delta)
                yield {"type": "delta", "delta": delta}

        full_text = "".join(completion_chunks)
        try:
            enc = tiktoken.encoding_for_model(model)
        except Exception:
            enc = tiktoken.get_encoding("cl100k_base")
        completion_tokens = len(enc.encode(full_text))

        yield {
            "type": "done",
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            }
        }

    else:
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=False,
        )
        content = resp.choices[0].message.content
        try:
            enc = tiktoken.encoding_for_model(model)
        except Exception:
            enc = tiktoken.get_encoding("cl100k_base")
        completion_tokens = len(enc.encode(content))

        return {
            "text": content,
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            }
        }




def simple_completion(model: str, prompt: str, temperature: float = 0.3) -> str:
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": "너는 대화를 요약하는 어시스턴트야."},
                  {"role": "user", "content": prompt}],
        temperature=temperature,
        stream=False,
    )
    return resp.choices[0].message.content
