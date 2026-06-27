"""Extract text from PDFs, chunk it, and prepare for embedding."""

import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter


def extract_text(filepath: str) -> list[dict]:
    """Extract text from a PDF file.

    Returns a list of {page, text} dicts, one per page that has content.
    """

    doc = fitz.open(filepath)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if text:
            pages.append({"page": i + 1, "text": text})
    doc.close()
    return pages


def chunk_text(pages: list[dict], chunk_size: int = 500, overlap: int = 50) -> list[dict]:
    """Split extracted pages into overlapping text chunks using LangChain.

    Uses RecursiveCharacterTextSplitter which splits at natural boundaries:
    paragraph breaks → line breaks → sentence endings → spaces → characters.

    Each chunk dict: {text, chunk_index, page}
    """

    if not pages or chunk_size <= 0:
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    chunks = []
    for p in pages:
        page_chunks = splitter.split_text(p["text"])
        for text in page_chunks:
            if text.strip():
                chunks.append({
                    "text": text,
                    "chunk_index": len(chunks),
                    "page": p["page"],
                })

    return chunks


def process_document(filepath: str, filename: str, document_id: str, study_set_id: str,
                     chunk_size: int = 500, overlap: int = 50) -> int:
    """Full pipeline: extract → chunk → embed → store in ChromaDB.

    Returns the number of chunks stored.
    """

    from services.embedding_service import store_chunks

    pages = extract_text(filepath)
    chunks = chunk_text(pages, chunk_size, overlap)
    if not chunks:
        return 0

    store_chunks(chunks, document_id, study_set_id, filename)
    return len(chunks)
