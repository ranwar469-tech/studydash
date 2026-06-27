from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet
from schemas import StudySetCreate, StudySetResponse
from services.embedding_service import delete_collection

router = APIRouter(prefix="/api/study-sets", tags=["study-sets"])


@router.get("", response_model=list[StudySetResponse])
def list_study_sets(db: Session = Depends(get_db)):
    sets = db.query(StudySet).all()
    result = []
    for s in sets:
        result.append(StudySetResponse(
            id=s.id,
            title=s.title,
            subject=s.subject,
            document_count=len(s.documents),
            created_at=s.created_at,
            updated_at=s.updated_at,
        ))
    return result


@router.post("", response_model=StudySetResponse, status_code=201)
def create_study_set(data: StudySetCreate, db: Session = Depends(get_db)):
    s = StudySet(title=data.title, subject=data.subject)
    db.add(s)
    db.commit()
    db.refresh(s)
    return StudySetResponse(
        id=s.id,
        title=s.title,
        subject=s.subject,
        document_count=0,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get("/{set_id}", response_model=StudySetResponse)
def get_study_set(set_id: str, db: Session = Depends(get_db)):
    s = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not s:
        raise HTTPException(404, "Study set not found")
    return StudySetResponse(
        id=s.id,
        title=s.title,
        subject=s.subject,
        document_count=len(s.documents),
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.delete("/{set_id}", status_code=204)
def delete_study_set(set_id: str, db: Session = Depends(get_db)):
    s = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not s:
        raise HTTPException(404, "Study set not found")
    delete_collection(set_id)
    db.delete(s)
    db.commit()
