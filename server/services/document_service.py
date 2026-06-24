"""Extract text from PDFs, chunk it, and prepare for embedding.

TODO: Implement real PDF extraction with PyMuPDF.
"""


def extract_text(filepath: str) -> str:
    """Extract plain text from a PDF file, returning text per page."""

    # TODO: import fitz (PyMuPDF)
    # doc = fitz.open(filepath)
    # pages = [page.get_text() for page in doc]
    # doc.close()
    # return "\n\n".join(pages)

    return ""


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[dict]:
    """Split text into overlapping chunks with metadata."""

    # TODO: implement text splitting with overlap tracking
    # Each chunk: { "text": str, "page": int, "chunk_index": int }

    return []


def process_document(filepath: str, document_id: str, study_set_id: str, chunk_size: int = 500, overlap: int = 50) -> int:
    """Full pipeline: extract → chunk → embed → store in ChromaDB.

    Returns the number of chunks stored.
    """

    # TODO:
    # text = extract_text(filepath)
    # chunks = chunk_text(text, chunk_size, overlap)
    # embed_and_store(chunks, document_id, study_set_id)
    # return len(chunks)

    return 0
