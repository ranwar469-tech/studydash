from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from limiter import limiter
from database import get_db
from models import StudySet
from schemas import SummaryResponse
from services.summary_service import generate_summary as gen_summary, get_summary
from pydantic import BaseModel

router = APIRouter(tags=["summary"])


class GenerateRequest(BaseModel):
    document_ids: list[str] | None = None


@router.get("/api/study-sets/{set_id}/summary", response_model=SummaryResponse)
@limiter.limit("30/minute")
async def fetch_summary(request: Request, set_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudySet).where(StudySet.id == set_id))
    study_set = result.scalars().first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    saved = await get_summary(set_id)
    if not saved:
        raise HTTPException(404, "No summary yet. Generate one first.")
    return SummaryResponse(**saved)


@router.post("/api/study-sets/{set_id}/summary", response_model=SummaryResponse)
@limiter.limit("3/minute")
async def generate_summary(request: Request, set_id: str, body: GenerateRequest = GenerateRequest(), db: AsyncSession = Depends(get_db)):
    result_query = await db.execute(select(StudySet).where(StudySet.id == set_id))
    study_set = result_query.scalars().first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    result = await gen_summary(set_id, document_ids=body.document_ids)
    if not result["content"]:
        raise HTTPException(400, "Could not generate summary. Upload documents first.")
    return SummaryResponse(**result)
