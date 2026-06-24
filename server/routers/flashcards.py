from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet, Flashcard
from schemas import FlashcardResponse, FlashcardMasteryUpdate

router = APIRouter(tags=["flashcards"])


@router.get("/api/study-sets/{set_id}/flashcards", response_model=list[FlashcardResponse])
def list_flashcards(set_id: str, db: Session = Depends(get_db)):
    cards = db.query(Flashcard).filter(Flashcard.study_set_id == set_id).all()
    return [
        FlashcardResponse(
            id=c.id,
            question=c.question,
            answer=c.answer,
            explanation=c.explanation,
            mastery=c.mastery,
        )
        for c in cards
    ]


@router.post("/api/study-sets/{set_id}/flashcards/generate", response_model=list[FlashcardResponse], status_code=201)
def generate_flashcards(set_id: str, db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    # TODO: Call DeepSeek to generate flashcards from document chunks
    # For now, return placeholder cards
    placeholders = [
        {"q": "What is a key concept?", "a": f"A key concept from {study_set.title}."},
        {"q": "Why does this matter?", "a": "Understanding this helps build a strong foundation."},
        {"q": "How is this applied?", "a": "It applies in real-world scenarios and problem-solving."},
    ]

    cards = []
    for p in placeholders:
        card = Flashcard(
            study_set_id=set_id,
            question=p["q"],
            answer=p["a"],
        )
        db.add(card)
        cards.append(card)
    db.commit()
    for c in cards:
        db.refresh(c)

    return [
        FlashcardResponse(
            id=c.id,
            question=c.question,
            answer=c.answer,
            explanation=c.explanation,
            mastery=c.mastery,
        )
        for c in cards
    ]


@router.patch("/api/flashcards/{card_id}", response_model=FlashcardResponse)
def update_flashcard_mastery(card_id: str, data: FlashcardMasteryUpdate, db: Session = Depends(get_db)):
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(404, "Flashcard not found")
    card.mastery = data.mastery
    db.commit()
    db.refresh(card)
    return FlashcardResponse(
        id=card.id,
        question=card.question,
        answer=card.answer,
        explanation=card.explanation,
        mastery=card.mastery,
    )
