from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet
from schemas import SummaryResponse
from services.summary_service import generate_summary as gen_summary, get_summary
from pydantic import BaseModel

router = APIRouter(tags=["summary"])


class GenerateRequest(BaseModel):
    document_ids: list[str] | None = None


@router.get("/api/study-sets/{set_id}/summary", response_model=SummaryResponse)
def fetch_summary(set_id: str, db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    saved = get_summary(set_id)
    if not saved:
        raise HTTPException(404, "No summary yet. Generate one first.")
    return SummaryResponse(**saved)


@router.post("/api/study-sets/{set_id}/summary", response_model=SummaryResponse)
def generate_summary(set_id: str, body: GenerateRequest = GenerateRequest(), db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    result = gen_summary(set_id, document_ids=body.document_ids)
    if not result["content"]:
        raise HTTPException(400, "Could not generate summary. Upload documents first.")
    return SummaryResponse(**result)
