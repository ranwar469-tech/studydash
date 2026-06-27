"""Query ChromaDB to find relevant chunks for a user question.

Qwen3-Embedding handles queries and documents the same way,
so we can use query_texts instead of manual embeddings.
"""

from config import TOP_K
from services.embedding_service import _collection


def retrieve_chunks(question: str, study_set_id: str, top_k: int = TOP_K,
                    document_ids: list[str] | None = None) -> list[dict]:
    """Search ChromaDB (auto-embeds via the collection's HF function) and return top-k chunks."""

    collection = _collection(study_set_id, create=False)
    if not collection or collection.count() == 0:
        return []

    kwargs = {
        "query_texts": [question],
        "n_results": min(top_k, collection.count()),
    }
    if document_ids:
        kwargs["where"] = {"document_id": {"$in": document_ids}}

    results = collection.query(**kwargs)

    if not results["documents"] or not results["documents"][0]:
        return []

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i] if results["metadatas"] and results["metadatas"][0] else {}
        dist = results["distances"][0][i] if results["distances"] and results["distances"][0] else 0.0
        chunks.append({
            "text": doc,
            "score": round(max(0.0, 1.0 - dist), 4),
            "filename": meta.get("filename", ""),
            "page": meta.get("page", 0),
        })

    return chunks
