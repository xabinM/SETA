# app/utils/es.py
from elasticsearch import Elasticsearch
from app.core.config import get_settings
from typing import Optional
import time
from functools import lru_cache
import os


_settings = get_settings()
_es: Optional[Elasticsearch] = None

@lru_cache(maxsize=1)
def get_es() -> Elasticsearch:
    """
    싱글톤 ES 클라이언트 (연결 재사용)
    """
    hosts = os.getenv("ELASTICSEARCH_HOSTS", "http://elasticsearch:9200").split(",")
    return Elasticsearch(hosts)

def es_health_ok() -> bool:
    try:
        get_es().cluster.health()
        return True
    except Exception:
        return False

def get_es() -> Elasticsearch:

    global _es
    if _es is None:
        _es = Elasticsearch(
            _settings.ELASTICSEARCH_URL,
            request_timeout=10,
            retry_on_timeout=True,
            max_retries=3,
        )
    return _es


def es_ping() -> bool:
    try:
        return get_es().ping()
    except Exception:
        return False


def es_info() -> dict:
    try:
        return get_es().info()
    except Exception as e:
        return {"error": str(e)}


def wait_for_es(timeout_sec: int = 30) -> bool:
    """
    Wait until ES responds to ping or timeout
    """
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        if es_ping():
            return True
        time.sleep(1)
    return False


def es_health() -> dict:
    """
    Return ES cluster health info
    """
    try:
        es = get_es()
        if not es.ping():
            return {"connected": False}
        health = es.cluster.health()
        info = es.info()
        return {
            "connected": True,
            "cluster_name": health.get("cluster_name"),
            "status": health.get("status"),
            "number_of_nodes": health.get("number_of_nodes"),
            "active_primary_shards": health.get("active_primary_shards"),
            "version": info.get("version", {}).get("number"),
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}


def close_es():
    """
    Close ES client (for shutdown)
    """
    global _es
    if _es is not None:
        try:
            _es.close()
        except Exception:
            pass
        _es = None
