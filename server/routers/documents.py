import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from limiter import limiter
from database import get_db
from models import StudySet, Document
from schemas import DocumentResponse
from config import UPLOAD_DIR
from services.document_service import process_document, SUPPORTED_EXTENSIONS
from services.embedding_service import delete_chunks


router = APIRouter(tags=["documents"])


@router.post("/api/study-sets/{set_id}/documents", response_model=DocumentResponse, status_code=201)
@limiter.limit("10/minute")
async def upload_document(request: Request, set_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudySet).where(StudySet.id == set_id))
    study_set = result.scalars().first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    if not file.filename:
        raise HTTPException(400, "No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported file type: {ext}. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    saved_name = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, saved_name)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    doc = Document(
        study_set_id=set_id,
        filename=file.filename,
        filepath=filepath,
        chunk_count=0,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc, ["study_set"])

    try:
        chunk_count, ocr_count = process_document(
            filepath=filepath,
            filename=doc.filename,
            document_id=doc.id,
            study_set_id=set_id,
        )
        doc.chunk_count = chunk_count
        doc.ocr_pages = ocr_count
        await db.commit()
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Clean up: remove the orphaned file and DB row
        if os.path.exists(filepath):
            os.remove(filepath)
        await db.delete(doc)
        await db.commit()
        raise HTTPException(400, f"Document processing failed: {e}")

    return _doc_response(doc)


def _doc_response(d: Document) -> DocumentResponse:
    return DocumentResponse(
        id=d.id,
        study_set_id=d.study_set_id,
        study_set_title=d.study_set.title if d.study_set else "",
        filename=d.filename,
        chunk_count=d.chunk_count,
        ocr_pages=d.ocr_pages,
        uploaded_at=d.uploaded_at,
    )


@router.get("/api/study-sets/{set_id}/documents", response_model=list[DocumentResponse])
@limiter.limit("60/minute")
async def list_documents(request: Request, set_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.study_set_id == set_id).options(selectinload(Document.study_set))
    )
    docs = result.scalars().all()
    return [_doc_response(d) for d in docs]


@router.get("/api/documents", response_model=list[DocumentResponse])
@limiter.limit("60/minute")
async def list_all_documents(request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).order_by(Document.uploaded_at.desc()).options(selectinload(Document.study_set))
    )
    docs = result.scalars().all()
    return [_doc_response(d) for d in docs]


@router.delete("/api/documents/{doc_id}", status_code=204)
@limiter.limit("15/minute")
async def delete_document(request: Request, doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)

    delete_chunks(document_id=doc.id, study_set_id=doc.study_set_id)

    await db.delete(doc)
    await db.commit()


@router.get("/api/documents/{doc_id}/file")
@limiter.limit("60/minute")
async def serve_document_file(request: Request, doc_id: str, db: AsyncSession = Depends(get_db)):
    """Serve the raw PDF file so the browser can display it inline."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if not os.path.exists(doc.filepath):
        raise HTTPException(404, "File not found on disk")
    return FileResponse(
        doc.filepath,
        media_type="application/pdf",
        filename=doc.filename,
    )
