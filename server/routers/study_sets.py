import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from limiter import limiter
from database import get_db
from models import StudySet, Document
from schemas import StudySetCreate, StudySetUpdate, StudySetResponse
from services.embedding_service import delete_collection

router = APIRouter(prefix="/api/study-sets", tags=["study-sets"])


@router.get("", response_model=list[StudySetResponse])
@limiter.limit("60/minute")
async def list_study_sets(request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudySet).options(selectinload(StudySet.documents)))
    sets = result.scalars().all()
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
@limiter.limit("30/minute")
async def create_study_set(request: Request, data: StudySetCreate, db: AsyncSession = Depends(get_db)):
    s = StudySet(title=data.title, subject=data.subject)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return StudySetResponse(
        id=s.id,
        title=s.title,
        subject=s.subject,
        document_count=0,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get("/{set_id}", response_model=StudySetResponse)
@limiter.limit("60/minute")
async def get_study_set(request: Request, set_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StudySet).where(StudySet.id == set_id).options(selectinload(StudySet.documents))
    )
    s = result.scalars().first()
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


@router.patch("/{set_id}", response_model=StudySetResponse)
@limiter.limit("30/minute")
async def update_study_set(request: Request, set_id: str, data: StudySetUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StudySet).where(StudySet.id == set_id).options(selectinload(StudySet.documents))
    )
    s = result.scalars().first()
    if not s:
        raise HTTPException(404, "Study set not found")

    if data.title is not None:
        s.title = data.title
    if data.subject is not None:
        s.subject = data.subject

    await db.commit()
    await db.refresh(s)
    return StudySetResponse(
        id=s.id,
        title=s.title,
        subject=s.subject,
        document_count=len(s.documents),
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.delete("/{set_id}", status_code=204)
@limiter.limit("15/minute")
async def delete_study_set(request: Request, set_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudySet).where(StudySet.id == set_id))
    s = result.scalars().first()
    if not s:
        raise HTTPException(404, "Study set not found")

    # Clean up physical PDF files from disk
    result_docs = await db.execute(select(Document).where(Document.study_set_id == set_id))
    docs = result_docs.scalars().all()
    for doc in docs:
        if doc.filepath and os.path.exists(doc.filepath):
            os.remove(doc.filepath)

    delete_collection(set_id)
    await db.delete(s)
    await db.commit()
