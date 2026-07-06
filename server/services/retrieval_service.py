"""Query ChromaDB to find relevant chunks for a user question.

Qwen3-Embedding handles queries and documents the same way,
so we can use query_texts instead of manual embeddings.
"""

from config import TOP_K
from services.embedding_service import _collection


def retrieve_chunks(question: str, study_set_id: str, top_k: int = TOP_K,
                    document_ids: list[str] | None = None,
                    pages: list[int] | None = None) -> list[dict]:
    """Search ChromaDB and return top-k matching chunks.

    If pages is provided, also fetch chunks from those specific pages and merge.
    """

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
        chunks = []
    else:
        chunks = []
        seen_keys = set()
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] and results["metadatas"][0] else {}
            key = f"{meta.get('document_id','')}_p{meta.get('page',0)}_{meta.get('chunk_index',i)}"
            if key in seen_keys:
                continue
            seen_keys.add(key)
            chunks.append({
                "text": doc,
                "score": round(max(0.0, 1.0 - results["distances"][0][i]), 4) if results.get("distances") else 0.0,
                "filename": meta.get("filename", ""),
                "page": meta.get("page", 0),
                "document_id": meta.get("document_id", ""),
            })

    # Fetch page-specific chunks
    if pages:
        for p in pages:
            page_kwargs = {
                "query_texts": [question],
                "n_results": min(3, collection.count()),
                "where": {"page": p},
            }
            if document_ids:
                page_kwargs["where"] = {"$and": [{"document_id": {"$in": document_ids}}, {"page": p}]}
            try:
                pr = collection.query(**page_kwargs)
                if pr["documents"] and pr["documents"][0]:
                    for i, doc in enumerate(pr["documents"][0]):
                        meta = pr["metadatas"][0][i] if pr["metadatas"] and pr["metadatas"][0] else {}
                        key = f"{meta.get('document_id','')}_p{meta.get('page',0)}_{meta.get('chunk_index',i)}"
                        if key in seen_keys:
                            continue
                        seen_keys.add(key)
                        chunks.append({
                            "text": doc,
                            "score": 0.0,
                            "filename": meta.get("filename", ""),
                            "page": meta.get("page", 0),
                            "document_id": meta.get("document_id", ""),
                        })
            except Exception:
                pass

    return chunks


def get_all_chunks(
    study_set_id: str,
    document_ids: list[str] | None = None,
    max_chunks: int = 200,
) -> list[dict]:
    """Return ALL chunks from a study set — no semantic filter, just raw document text.

    Uses collection.get() which returns chunks by ID/metadata without embedding
    a query vector. Perfect for summarization, flashcard generation, and quiz
    generation where you need COMPREHENSIVE coverage, not targeted retrieval.

    Chunks are returned in page order so the LLM sees them in document sequence.
    """
    collection = _collection(study_set_id, create=False)
    if not collection or collection.count() == 0:
        return []

    kwargs: dict = {}
    if document_ids:
        kwargs["where"] = {"document_id": {"$in": document_ids}}

    results = collection.get(**kwargs)

    if not results["documents"]:
        return []

    chunks = []
    for i, doc in enumerate(results["documents"]):
        meta = results["metadatas"][i] if results["metadatas"] else {}
        chunks.append({
            "text": doc,
            "filename": meta.get("filename", ""),
            "page": meta.get("page", 0),
            "chunk_index": meta.get("chunk_index", 0),
            "document_id": meta.get("document_id", ""),
        })

    # Sort by (filename, page, chunk_index) so chunks appear in document order
    chunks.sort(key=lambda c: (c["filename"], c["page"], c["chunk_index"]))

    # If too many, take an evenly-distributed sample to fit the context window
    if len(chunks) > max_chunks:
        step = len(chunks) / max_chunks
        sampled = []
        for i in range(max_chunks):
            idx = int(i * step)
            if idx < len(chunks):
                sampled.append(chunks[idx])
        return sampled

    return chunks
