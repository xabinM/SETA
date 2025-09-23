import os
from app.utils.es import get_es

es = get_es()
INDEX_NAME = os.getenv("EMBED_INDEX_NAME", "user_memory_embedding")


def search_similar(user_id: str, query: str, k: int = 5, min_score: float = 0.7):
    """
    특정 user_id의 메모리에서 semantic search 실행
    """
    q = {
        "knn": {
            "embedding": {
                "vector": None,
                "k": k
            }
        },
        "_source": ["embedding_id", "user_id", "source_id", "content", "created_at"]
    }

    from app.services.embed_service import embed_text
    emb = embed_text(query)
    q["knn"]["embedding"]["vector"] = emb

    resp = es.search(index=INDEX_NAME, knn=q)

    hits = []
    for h in resp.get("hits", {}).get("hits", []):
        score = h["_score"]
        if score >= min_score:
            hits.append({
                "embedding_id": h["_source"]["embedding_id"],
                "user_id": h["_source"]["user_id"],
                "source_id": h["_source"]["source_id"],
                "content": h["_source"]["content"],
                "score": score,
                "created_at": h["_source"]["created_at"],
            })

    return hits
