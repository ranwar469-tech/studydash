"""Query ChromaDB to find relevant chunks for a user question.

Uses ChromaDB's built-in ONNX model for local embedding — no API key needed.
"""

from config import TOP_K
from services.embedding_service import _collection


def retrieve_chunks(question: str, study_set_id: str, top_k: int = TOP_K) -> list[dict]:
    """Search ChromaDB and return top-k matching chunks with scores."""

    collection = _collection(study_set_id, create=False)
    if not collection or collection.count() == 0:
        return []

    results = collection.query(
        query_texts=[question],
        n_results=min(top_k, collection.count()),
    )

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
