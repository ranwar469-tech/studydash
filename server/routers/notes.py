from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from limiter import limiter
from database import get_db
from models import StudySet, Note
from schemas import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter(tags=["notes"])


@router.get("/api/study-sets/{set_id}/notes", response_model=list[NoteResponse])
@limiter.limit("60/minute")
async def list_notes(request: Request, set_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Note).where(Note.study_set_id == set_id).order_by(Note.updated_at.desc())
    )
    notes = result.scalars().all()
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
@limiter.limit("30/minute")
async def create_note(request: Request, set_id: str, data: NoteCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudySet).where(StudySet.id == set_id))
    study_set = result.scalars().first()
    if not study_set:
        raise HTTPException(404, "Study set not found")
    note = Note(study_set_id=set_id, title=data.title, content=data.content)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return NoteResponse(
        id=note.id,
        study_set_id=note.study_set_id,
        title=note.title,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.patch("/api/notes/{note_id}", response_model=NoteResponse)
@limiter.limit("30/minute")
async def update_note(request: Request, note_id: str, data: NoteUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalars().first()
    if not note:
        raise HTTPException(404, "Note not found")
    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    await db.commit()
    await db.refresh(note)
    return NoteResponse(
        id=note.id,
        study_set_id=note.study_set_id,
        title=note.title,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.delete("/api/notes/{note_id}", status_code=204)
@limiter.limit("15/minute")
async def delete_note(request: Request, note_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalars().first()
    if not note:
        raise HTTPException(404, "Note not found")
    await db.delete(note)
    await db.commit()
