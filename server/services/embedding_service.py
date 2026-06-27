"""Generate embeddings via ChromaDB's built-in local model and manage ChromaDB collections."""

import chromadb
from config import CHROMA_PERSIST_DIR


def _embedding_func():
    from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
    return ONNXMiniLM_L6_V2()


def _collection(study_set_id: str, create: bool = True):
    db = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    if create:
        return db.get_or_create_collection(
            name=f"set_{study_set_id}",
            embedding_function=_embedding_func(),
        )
    try:
        return db.get_collection(
            name=f"set_{study_set_id}",
            embedding_function=_embedding_func(),
        )
    except Exception:
        return None


def store_chunks(chunks: list[dict], document_id: str, study_set_id: str, filename: str) -> int:
    """ChromaDB automatically generates embeddings using the local ONNX model.

    Returns the number of chunks stored.
    """

    collection = _collection(study_set_id)
    existing = collection.get(where={"document_id": document_id})
    if existing["ids"]:
        collection.delete(ids=existing["ids"])

    texts = [c["text"] for c in chunks]
    ids = [f"{document_id}_chunk_{c['chunk_index']}" for c in chunks]
    metadatas = [
        {
            "document_id": document_id,
            "filename": filename,
            "page": c.get("page", 0),
            "chunk_index": c["chunk_index"],
        }
        for c in chunks
    ]

    collection.add(ids=ids, documents=texts, metadatas=metadatas)
    return len(chunks)


def delete_chunks(document_id: str, study_set_id: str) -> None:
    """Remove all chunks belonging to a document from ChromaDB."""

    collection = _collection(study_set_id, create=False)
    if collection:
        collection.delete(where={"document_id": document_id})


def delete_collection(study_set_id: str) -> None:
    """Delete an entire collection when a study set is removed."""

    try:
        db = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        db.delete_collection(f"set_{study_set_id}")
    except Exception:
        pass
