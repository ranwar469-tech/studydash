from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet, Note
from schemas import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter(tags=["notes"])


@router.get("/api/study-sets/{set_id}/notes", response_model=list[NoteResponse])
def list_notes(set_id: str, db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.study_set_id == set_id).order_by(Note.updated_at.desc()).all()
    return [
        NoteResponse(
            id=n.id,
            study_set_id=n.study_set_id,
            title=n.title,
            content=n.content,
            created_at=n.created_at,
            updated_at=n.updated_at,
        )
        for n in notes
    ]


@router.post("/api/study-sets/{set_id}/notes", response_model=NoteResponse, status_code=201)
def create_note(set_id: str, data: NoteCreate, db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")
    note = Note(study_set_id=set_id, title=data.title, content=data.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteResponse(
        id=note.id,
        study_set_id=note.study_set_id,
        title=note.title,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.patch("/api/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, data: NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    db.commit()
    db.refresh(note)
    return NoteResponse(
        id=note.id,
        study_set_id=note.study_set_id,
        title=note.title,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: str, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    db.delete(note)
    db.commit()
