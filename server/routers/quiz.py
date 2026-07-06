import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from limiter import limiter
from database import get_db
from models import QuizQuestion
from schemas import QuizQuestionResponse, QuizSubmitRequest, QuizSubmitResponse
from services.quiz_service import generate_quiz as gen_quiz
from pydantic import BaseModel

router = APIRouter(tags=["quiz"])


class GenerateRequest(BaseModel):
    document_ids: list[str] | None = None


@router.get("/api/study-sets/{set_id}/quiz", response_model=list[QuizQuestionResponse])
@limiter.limit("30/minute")
async def list_quiz(request: Request, set_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.study_set_id == set_id))
    questions = result.scalars().all()
    return [
        QuizQuestionResponse(
            id=q.id, question=q.question, options=json.loads(q.options),
            correct_index=q.correct_index, explanation=q.explanation,
        )
        for q in questions
    ]


@router.post("/api/study-sets/{set_id}/quiz/generate", response_model=list[QuizQuestionResponse], status_code=201)
@limiter.limit("5/minute")
async def generate_quiz(request: Request, set_id: str, body: GenerateRequest = GenerateRequest(), db: AsyncSession = Depends(get_db)):
    questions = await gen_quiz(set_id, document_ids=body.document_ids)
    if not questions:
        raise HTTPException(400, "Could not generate quiz. Upload documents first.")
    return [
        QuizQuestionResponse(
            id=q["id"], question=q["question"], options=q["options"],
            correct_index=q["correctIndex"], explanation=q["explanation"],
        )
        for q in questions
    ]


@router.post("/api/study-sets/{set_id}/quiz/submit", response_model=QuizSubmitResponse)
@limiter.limit("20/minute")
async def submit_quiz(request: Request, set_id: str, data: QuizSubmitRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.study_set_id == set_id))
    questions = result.scalars().all()
    q_map = {q.id: q for q in questions}
    score = 0
    for answer in data.answers:
        q = q_map.get(answer.get("question_id"))
        if q and q.correct_index == answer.get("selected_index"):
            score += 1
    return QuizSubmitResponse(score=score, total=len(questions))
