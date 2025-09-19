from elasticsearch import Elasticsearch
import os

def get_es_client() -> Elasticsearch:
    host = os.environ.get("ELASTICSEARCH_URL")  # <-- ELASTICSEARCH_URL만 사용
    if not host:
        raise RuntimeError("ELASTICSEARCH_URL not found in environment")
    return Elasticsearch(hosts=[host])
