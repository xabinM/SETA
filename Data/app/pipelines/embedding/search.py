import os
from app.utils.es import get_es

es = get_es()
INDEX_NAME = os.getenv("EMBED_INDEX_NAME", "user_memory_embedding")


def search_similar(user_id: str, embedding, k: int = 5, min_score: float = 0.7):
    """
    ES에서 KNN 검색 (임베딩은 외부에서 생성해서 주입)
    """
    query = {
        "knn": {
            "field": "embedding",
            "query_vector": embedding,
            "k": k,
            "num_candidates": max(k * 2, 10),  # 후보 넉넉히 확보
        },
        "_source": ["embedding_id", "user_id", "source_id", "content", "created_at"],
    }

    resp = es.search(index=INDEX_NAME, knn=query)

    hits = []
    for h in resp.get("hits", {}).get("hits", []):
        score = h["_score"]
        if score >= min_score:
            src = h["_source"]
            hits.append({
                "embedding_id": src["embedding_id"],
                "user_id": src["user_id"],
                "source_id": src["source_id"],
                "content": src["content"],
                "score": score,
                "created_at": src.get("created_at"),
            })

    return hits
