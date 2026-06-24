"""Query ChromaDB to find relevant chunks for a user question.

TODO: Implement real ChromaDB similarity search.
"""


def retrieve_chunks(question: str, study_set_id: str, top_k: int = 5) -> list[dict]:
    """Embed the question, search ChromaDB, return top-k matching chunks."""

    # TODO:
    # from services.embedding_service import embed_query
    # import chromadb
    # client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    # collection = client.get_or_create_collection(f"set_{study_set_id}")
    # query_vector = embed_query(question)
    # results = collection.query(query_embeddings=[query_vector], n_results=top_k)
    # return [
    #     {"text": doc, "score": dist, "filename": meta["filename"], "page": meta.get("page")}
    #     for doc, dist, meta in zip(results["documents"][0], results["distances"][0], results["metadatas"][0])
    # ]

    return []
