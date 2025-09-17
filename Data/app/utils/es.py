# app/utils/es.py
from __future__ import annotations

import os
import time
from typing import Optional, Dict, Any
from elasticsearch import Elasticsearch

_ES: Optional[Elasticsearch] = None


def _create_es() -> Elasticsearch:
    """
    환경변수 기반으로 ES 클라이언트를 생성합니다.
    - ELASTICSEARCH_URL 미설정 시 서버 FQDN 기본값 사용.
    - ES 8.x 클라이언트 옵션: retry_on_timeout, max_retries 등 설정.
    """
    url = os.getenv("ELASTICSEARCH_URL", "http://j13a403a.p.ssafy.io:9200")
    return Elasticsearch(
        url,
        request_timeout=10,
        retry_on_timeout=True,
        max_retries=3,
    )


def get_es() -> Elasticsearch:
    """
    Lazy singleton. 최초 호출 시에만 생성.
    """
    global _ES
    if _ES is None:
        _ES = _create_es()
    return _ES


def wait_for_es(timeout_sec: int = 15, interval_sec: float = 0.5) -> bool:
    """
    컨테이너 기동 직후 ES가 아직 준비되지 않았을 수 있으니,
    짧게 ping 재시도를 해준다. (헬스체크 안정화)
    """
    es = get_es()
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            if es.ping():
                return True
        except Exception:
            pass
        time.sleep(interval_sec)
    return False


def es_health() -> Dict[str, Any]:
    """
    헬스 엔드포인트에서 사용하기 좋은 요약 상태를 반환.
    """
    try:
        es = get_es()
        ok = es.ping()
        info = es.info() if ok else {}
        return {
            "connected": bool(ok),
            "cluster_name": info.get("cluster_name"),
            "version": (info.get("version") or {}).get("number"),
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}


def close_es() -> None:
    """
    종료 훅에서 호출할 수 있는 정리 함수.
    """
    global _ES
    if _ES is not None:
        try:
            _ES.close()
        finally:
            _ES = None
