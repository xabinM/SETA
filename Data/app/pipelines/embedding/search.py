# app/pipelines/embedding/search.py
from typing import List, Dict, Any, Optional
from app.utils.es import get_es
from app.core.config import get_settings
from .model import get_embedding

_settings = get_settings()
es = get_es()
INDEX_NAME = _settings.EMBED_INDEX_NAME


def search_similar(
    user_seq: int,
    query: str,
    k: int = 5,
    num_candidates: int = 100,
    min_score: Optional[float] = -1.0,
) -> List[Dict[str, Any]]:
    """
    주어진 쿼리(query)에 대해 user_seq 범위 내에서 KNN 검색 수행
    - user_seq: 사용자 식별자 (해당 사용자 데이터만 검색)
    - query: 검색 질의 텍스트
    - k: 최종 반환할 결과 개수
    - num_candidates: 후보군 (ES 내부에서 먼저 뽑는 수)
    - min_score: 유사도 최소 기준 (cosineSimilarity → -1 ~ 1)
    """
    emb = get_embedding(query)

    body = {
        "size": k,
        "query": {
            "script_score": {
                "query": {
                    "bool": {
                        "filter": [
                            {"term": {"user_seq.keyword": str(user_seq)}}
                        ]
                    }
                },
                "script": {
                    "source": "cosineSimilarity(params.query_vector, 'embedding')",
                    "params": {"query_vector": emb},
                },
            }
        },
    }

    kwargs = {"index": INDEX_NAME, "body": body}
    if isinstance(min_score, (int, float)):
        kwargs["min_score"] = float(min_score)

    resp = es.search(**kwargs)
    hits = resp.get("hits", {}).get("hits", [])

    results = [
        {
            "content": h["_source"].get("content"),
            "score": h.get("_score"),
            "trace_id": h["_source"].get("trace_id"),
        }
        for h in hits
    ]

    if isinstance(min_score, (int, float)):
        results = [
            r for r in results if r["score"] is not None and r["score"] >= float(min_score)
        ]

    return results
