import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet, Document
from schemas import DocumentResponse
from config import UPLOAD_DIR
from services.document_service import process_document
from services.embedding_service import delete_chunks


router = APIRouter(tags=["documents"])


@router.post("/api/study-sets/{set_id}/documents", response_model=DocumentResponse, status_code=201)
def upload_document(set_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    saved_name = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, saved_name)

    content = file.file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    doc = Document(
        study_set_id=set_id,
        filename=file.filename,
        filepath=filepath,
        chunk_count=0,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        chunk_count = process_document(
            filepath=filepath,
            filename=doc.filename,
            document_id=doc.id,
            study_set_id=set_id,
        )
        doc.chunk_count = chunk_count
        db.commit()
    except ValueError as e:
        # DeepSeek key not configured — still save the file, skip embedding
        doc.chunk_count = 0
        db.commit()

    return _doc_response(doc)


def _doc_response(d: Document) -> DocumentResponse:
    return DocumentResponse(
        id=d.id,
        study_set_id=d.study_set_id,
        study_set_title=d.study_set.title if d.study_set else "",
        filename=d.filename,
        chunk_count=d.chunk_count,
        uploaded_at=d.uploaded_at,
    )


@router.get("/api/study-sets/{set_id}/documents", response_model=list[DocumentResponse])
def list_documents(set_id: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.study_set_id == set_id).all()
    return [_doc_response(d) for d in docs]


@router.get("/api/documents", response_model=list[DocumentResponse])
def list_all_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return [_doc_response(d) for d in docs]


@router.delete("/api/documents/{doc_id}", status_code=204)
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)

    delete_chunks(document_id=doc.id, study_set_id=doc.study_set_id)

    db.delete(doc)
    db.commit()
