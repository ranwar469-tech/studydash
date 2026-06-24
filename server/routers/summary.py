from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet
from schemas import SummaryResponse

router = APIRouter(tags=["summary"])


@router.post("/api/study-sets/{set_id}/summary", response_model=SummaryResponse)
def generate_summary(set_id: str, db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    # TODO: Call DeepSeek with document chunks to generate a proper summary
    # For now, return a placeholder
    return SummaryResponse(
        content=f"This is a generated summary for **{study_set.title}**. "
                f"The full AI-powered summarization will be connected soon. "
                f"It will extract key concepts, important definitions, and core ideas "
                f"from your uploaded documents.",
        sections=[
            {"title": "Key Concepts", "desc": "Main ideas and foundational knowledge covered in the material."},
            {"title": "Important Definitions", "desc": "Critical terms and their meanings you need to remember."},
            {"title": "Core Principles", "desc": "Fundamental rules and theories that form the backbone of this subject."},
        ],
        takeaways=[
            f"{study_set.title} covers several interconnected topics",
            "Focus on understanding the relationships between concepts",
            "Practice problems reinforce theoretical knowledge",
            "Review material regularly for better retention",
        ],
    )
