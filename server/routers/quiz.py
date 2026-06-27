import json
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import QuizQuestion
from schemas import QuizQuestionResponse, QuizSubmitRequest, QuizSubmitResponse
from services.quiz_service import generate_quiz as gen_quiz

router = APIRouter(tags=["quiz"])


@router.get("/api/study-sets/{set_id}/quiz", response_model=list[QuizQuestionResponse])
def list_quiz(set_id: str, db: Session = Depends(get_db)):
    questions = db.query(QuizQuestion).filter(QuizQuestion.study_set_id == set_id).all()
    return [
        QuizQuestionResponse(
            id=q.id, question=q.question, options=json.loads(q.options),
            correct_index=q.correct_index, explanation=q.explanation,
        )
        for q in questions
    ]


@router.post("/api/study-sets/{set_id}/quiz/generate", response_model=list[QuizQuestionResponse], status_code=201)
def generate_quiz(set_id: str, db: Session = Depends(get_db)):
    questions = gen_quiz(set_id)
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
def submit_quiz(set_id: str, data: QuizSubmitRequest, db: Session = Depends(get_db)):
    questions = db.query(QuizQuestion).filter(QuizQuestion.study_set_id == set_id).all()
    q_map = {q.id: q for q in questions}
    score = 0
    for answer in data.answers:
        q = q_map.get(answer.get("question_id"))
        if q and q.correct_index == answer.get("selected_index"):
            score += 1
    return QuizSubmitResponse(score=score, total=len(questions))
