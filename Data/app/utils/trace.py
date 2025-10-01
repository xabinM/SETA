from typing import Dict, Optional

def extract_traceparent(headers: Dict[str, bytes]) -> Optional[str]:
    """
    Kafka 메시지 헤더(dict[str, bytes])에서 traceparent 추출
    """
    for k in ("traceparent", "Traceparent", "TRACEPARENT"):
        val = headers.get(k)
        if val:
            try:
                return val.decode() if isinstance(val, (bytes, bytearray)) else str(val)
            except Exception:
                return str(val)
    return None

def inject_traceparent(headers: Dict[str, bytes], traceparent: str) -> Dict[str, bytes]:
    """
    traceparent를 Kafka 헤더 dict에 삽입
    """
    new_hdrs = dict(headers or {})
    new_hdrs["traceparent"] = traceparent.encode()
    return new_hdrs
