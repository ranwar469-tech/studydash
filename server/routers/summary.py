from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet
from schemas import SummaryResponse
from services.summary_service import generate_summary as gen_summary

router = APIRouter(tags=["summary"])


@router.post("/api/study-sets/{set_id}/summary", response_model=SummaryResponse)
def generate_summary(set_id: str, db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    result = gen_summary(set_id)
    if not result["content"]:
        raise HTTPException(400, "Could not generate summary. Upload documents first.")
    return SummaryResponse(**result)
