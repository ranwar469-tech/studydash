"""Extract text from PDFs, DOCX, PPTX, TXT, CSV and prepare for embedding."""

import os
import csv
import io
import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import OCR_ENABLED, OCR_LANGUAGE, OCR_DPI, OCR_MIN_TEXT_LENGTH

# ── Per-format extractors ───────────────────────────────────────

def _extract_pdf(filepath: str) -> list[dict]:
    """Extract text from a PDF with OCR fallback for scanned pages."""
    doc = fitz.open(filepath)
    pages: list[dict] = []
    ocr_count = 0

    for i, page in enumerate(doc):
        text = page.get_text().strip()
        used_ocr = False

        if len(text) < OCR_MIN_TEXT_LENGTH and OCR_ENABLED:
            try:
                tp = page.get_textpage_ocr(flags=3, language=OCR_LANGUAGE, dpi=OCR_DPI)
                ocr_text = page.get_text(textpage=tp).strip()
                if ocr_text:
                    text = ocr_text
                    used_ocr = True
                    ocr_count += 1
            except Exception as e:
                print(f"[OCR] Page {i+1} failed ({e}) — keeping native text if any")

        if text:
            pages.append({"page": i + 1, "text": text, "ocr": used_ocr})

    doc.close()
    if ocr_count:
        print(f"[OCR] Used OCR on {ocr_count}/{len(pages)} pages of {filepath}")
    return pages


def _extract_docx(filepath: str) -> list[dict]:
    """Extract text from a .docx file. Paragraphs are grouped into pages."""
    from docx import Document as DocxDocument

    doc = DocxDocument(filepath)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    if not paragraphs:
        return []

    # Group paragraphs into ~page-sized chunks (roughly 40 lines per "page")
    lines_per_page = 40
    pages: list[dict] = []
    buffer: list[str] = []
    page_num = 1

    for para in paragraphs:
        buffer.append(para)
        if len(buffer) >= lines_per_page:
            pages.append({"page": page_num, "text": "\n\n".join(buffer), "ocr": False})
            buffer = []
            page_num += 1

    if buffer:
        pages.append({"page": page_num, "text": "\n\n".join(buffer), "ocr": False})

    return pages


def _extract_pptx(filepath: str) -> list[dict]:
    """Extract text from a .pptx file. Each slide becomes a page."""
    from pptx import Presentation

    prs = Presentation(filepath)
    pages: list[dict] = []

    for i, slide in enumerate(prs.slides):
        texts: list[str] = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    t = para.text.strip()
                    if t:
                        texts.append(t)
        if texts:
            pages.append({"page": i + 1, "text": "\n".join(texts), "ocr": False})

    return pages


def _extract_txt(filepath: str) -> list[dict]:
    """Extract text from a .txt or .md file. Splits into pages by blank lines."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read().strip()

    if not content:
        return []

    # Split into "pages" at double-newlines
    sections = [s.strip() for s in content.split("\n\n") if s.strip()]
    pages: list[dict] = []

    # Merge small sections until we hit ~2000 chars per page
    buffer: list[str] = []
    buffer_len = 0
    page_num = 1

    for sec in sections:
        buffer.append(sec)
        buffer_len += len(sec)
        if buffer_len >= 2000:
            pages.append({"page": page_num, "text": "\n\n".join(buffer), "ocr": False})
            buffer = []
            buffer_len = 0
            page_num += 1

    if buffer:
        pages.append({"page": page_num, "text": "\n\n".join(buffer), "ocr": False})

    return pages


def _extract_csv(filepath: str) -> list[dict]:
    """Extract text from a .csv file. Each row becomes readable text."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        headers = next(reader, None)

    if not headers:
        return []

    rows_text: list[str] = [", ".join(headers)]
    for row in reader:
        if any(cell.strip() for cell in row):
            rows_text.append(", ".join(row))

    # One "page" with all rows as readable text
    return [{"page": 1, "text": "\n".join(rows_text), "ocr": False}]


# ── Format dispatch ─────────────────────────────────────────────

# Map lowercase extension → extractor function
EXTRACTORS = {
    ".pdf":  _extract_pdf,
    ".docx": _extract_docx,
    ".pptx": _extract_pptx,
    ".txt":  _extract_txt,
    ".md":   _extract_txt,
    ".csv":  _extract_csv,
}

SUPPORTED_EXTENSIONS = set(EXTRACTORS.keys())


def extract_text(filepath: str) -> list[dict]:
    """Extract text from a file. Dispatches to the right extractor by extension.

    Returns a list of {page, text, ocr} dicts — one per unit of content.
    """
    ext = os.path.splitext(filepath)[1].lower()
    extractor = EXTRACTORS.get(ext)

    if not extractor:
        raise ValueError(f"Unsupported file type: {ext}")

    return extractor(filepath)


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
                     chunk_size: int = 500, overlap: int = 50) -> tuple[int, int]:
    """Full pipeline: extract → chunk → embed → store in ChromaDB.

    Returns a tuple of (chunk_count, ocr_page_count).
    """

    from services.embedding_service import store_chunks

    pages = extract_text(filepath)
    ocr_count = sum(1 for p in pages if p.get("ocr"))
    chunks = chunk_text(pages, chunk_size, overlap)
    if not chunks:
        return 0, ocr_count

    store_chunks(chunks, document_id, study_set_id, filename)
    return len(chunks), ocr_count
