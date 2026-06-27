"""Generate embeddings via HuggingFace InferenceClient and manage ChromaDB collections."""

import chromadb
from chromadb.api.types import Documents, Embeddings
from huggingface_hub import InferenceClient
from config import CHROMA_PERSIST_DIR, HF_TOKEN, HF_EMBED_MODEL


_client = None


def _get_client() -> InferenceClient:
    global _client
    if _client is None:
        if not HF_TOKEN:
            raise ValueError(
                "HF_TOKEN is not set. Create a server/.env file with:\n"
                "HF_TOKEN=hf_your_token_here"
            )
        _client = InferenceClient(api_key=HF_TOKEN)
    return _client


class HuggingFaceEmbeddingFunction:
    """ChromaDB embedding function via HuggingFace InferenceClient."""

    def name(self) -> str:
        return "hf-qwen3-embedding-8b"

    def __call__(self, input: Documents) -> Embeddings:
        return self._embed(input)

    def embed_query(self, input: list[str]) -> Embeddings:
        return self._embed(input)

    def embed_documents(self, input: list[str]) -> Embeddings:
        return self._embed(input)

    def _embed(self, input: list[str]) -> Embeddings:
        result = _get_client().feature_extraction(input, model=HF_EMBED_MODEL)
        if hasattr(result, "tolist"):
            return result.tolist()
        if isinstance(result[0], float):
            return [result]
        return result


def embed_query(text: str) -> list[float]:
    """Embed a single user question."""
    result = _get_client().feature_extraction(text, model=HF_EMBED_MODEL)
    if hasattr(result, "tolist"):
        return result.tolist()[0]
    return result


def _collection(study_set_id: str, create: bool = True):
    db = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    if create:
        return db.get_or_create_collection(
            name=f"set_{study_set_id}",
            embedding_function=HuggingFaceEmbeddingFunction(),
        )
    try:
        return db.get_collection(
            name=f"set_{study_set_id}",
            embedding_function=HuggingFaceEmbeddingFunction(),
        )
    except Exception:
        return None


def store_chunks(chunks: list[dict], document_id: str, study_set_id: str, filename: str) -> int:
    """ChromaDB auto-embeds via HuggingFace InferenceClient."""

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
    collection = _collection(study_set_id, create=False)
    if collection:
        collection.delete(where={"document_id": document_id})


def delete_collection(study_set_id: str) -> None:
    try:
        db = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        db.delete_collection(f"set_{study_set_id}")
    except Exception:
        pass
