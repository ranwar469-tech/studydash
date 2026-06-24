import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet, Document
from schemas import DocumentResponse
from config import UPLOAD_DIR

router = APIRouter(tags=["documents"])


@router.post("/api/study-sets/{set_id}/documents", response_model=DocumentResponse, status_code=201)
def upload_document(set_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    saved_name = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, saved_name)

    content = file.file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # TODO: extract text with PyMuPDF → chunk → embed → store in ChromaDB
    # For now, place the file and return
    doc = Document(
        study_set_id=set_id,
        filename=file.filename,
        filepath=filepath,
        chunk_count=0,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentResponse(
        id=doc.id,
        study_set_id=doc.study_set_id,
        filename=doc.filename,
        chunk_count=doc.chunk_count,
        uploaded_at=doc.uploaded_at,
    )


@router.get("/api/study-sets/{set_id}/documents", response_model=list[DocumentResponse])
def list_documents(set_id: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.study_set_id == set_id).all()
    return [
        DocumentResponse(
            id=d.id,
            study_set_id=d.study_set_id,
            filename=d.filename,
            chunk_count=d.chunk_count,
            uploaded_at=d.uploaded_at,
        )
        for d in docs
    ]


@router.delete("/api/documents/{doc_id}", status_code=204)
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    # Remove file from disk
    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)

    # TODO: remove chunks from ChromaDB

    db.delete(doc)
    db.commit()
