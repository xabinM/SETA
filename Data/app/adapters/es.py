from elasticsearch import Elasticsearch
import os

def get_es_client() -> Elasticsearch:
    """
    Elasticsearch 클라이언트 반환.
    - ES_HOST 환경변수 기반으로 연결
    """
    host = os.environ["ELASTICSEARCH_URL"]
    return Elasticsearch(hosts=[host])
