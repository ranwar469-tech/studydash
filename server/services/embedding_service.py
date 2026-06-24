"""Generate embeddings via DeepSeek API and manage ChromaDB collections.

TODO: Implement real embedding calls and ChromaDB operations.
"""


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Call DeepSeek embeddings API to convert text chunks to vectors."""

    # TODO:
    # from openai import OpenAI
    # client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    # response = client.embeddings.create(model=DEEPSEEK_EMBED_MODEL, input=texts)
    # return [d.embedding for d in response.data]

    return [[0.0]] * len(texts)


def embed_query(text: str) -> list[float]:
    """Embed a single user query string."""

    return embed_texts([text])[0]


def store_chunks(chunks: list[dict], document_id: str, study_set_id: str) -> int:
    """Store chunk texts + embeddings in ChromaDB collection.

    Returns the number of chunks stored.
    """

    # TODO:
    # import chromadb
    # client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    # collection = client.get_or_create_collection(f"set_{study_set_id}")
    # texts = [c["text"] for c in chunks]
    # ids = [f"{document_id}_chunk_{c['chunk_index']}" for c in chunks]
    # metadatas = [{"document_id": document_id, "filename": c["filename"], "page": c["page"]} for c in chunks]
    # embeddings = embed_texts(texts)
    # collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
    # return len(chunks)

    return 0


def delete_chunks(document_id: str, study_set_id: str) -> None:
    """Remove all chunks belonging to a document from ChromaDB."""

    # TODO:
    # client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    # collection = client.get_or_create_collection(f"set_{study_set_id}")
    # collection.delete(where={"document_id": document_id})


def delete_collection(study_set_id: str) -> None:
    """Delete an entire collection when a study set is removed."""

    # TODO:
    # client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    # client.delete_collection(f"set_{study_set_id}")
