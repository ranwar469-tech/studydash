import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet, QuizQuestion
from schemas import QuizQuestionResponse, QuizSubmitRequest, QuizSubmitResponse

router = APIRouter(tags=["quiz"])


@router.get("/api/study-sets/{set_id}/quiz", response_model=list[QuizQuestionResponse])
def list_quiz(set_id: str, db: Session = Depends(get_db)):
    questions = db.query(QuizQuestion).filter(QuizQuestion.study_set_id == set_id).all()
    return [
        QuizQuestionResponse(
            id=q.id,
            question=q.question,
            options=json.loads(q.options),
            correct_index=q.correct_index,
            explanation=q.explanation,
        )
        for q in questions
    ]


@router.post("/api/study-sets/{set_id}/quiz/generate", response_model=list[QuizQuestionResponse], status_code=201)
def generate_quiz(set_id: str, db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    # TODO: Call DeepSeek to generate MCQs from document chunks
    # For now, return placeholder questions
    placeholders = [
        {
            "q": f"What is the main topic of {study_set.title}?",
            "options": ["Understanding core concepts", "Memorization", "Random guessing", "Skipping details"],
            "correct": 0,
            "explanation": f"The main focus of {study_set.title} is understanding core concepts thoroughly.",
        },
        {
            "q": "What is the best approach to study this material?",
            "options": ["Active recall", "Passive reading", "Highlighting everything", "Listening to music"],
            "correct": 0,
            "explanation": "Active recall has been proven to be the most effective study technique for retention.",
        },
    ]

    questions = []
    for p in placeholders:
        q = QuizQuestion(
            study_set_id=set_id,
            question=p["q"],
            options=json.dumps(p["options"]),
            correct_index=p["correct"],
            explanation=p["explanation"],
        )
        db.add(q)
        questions.append(q)
    db.commit()
    for q in questions:
        db.refresh(q)

    return [
        QuizQuestionResponse(
            id=q.id,
            question=q.question,
            options=json.loads(q.options),
            correct_index=q.correct_index,
            explanation=q.explanation,
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
