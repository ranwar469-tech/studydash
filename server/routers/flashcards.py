from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Flashcard
from schemas import FlashcardResponse, FlashcardMasteryUpdate
from services.flashcard_service import generate_flashcards as gen_cards

router = APIRouter(tags=["flashcards"])


@router.get("/api/study-sets/{set_id}/flashcards", response_model=list[FlashcardResponse])
def list_flashcards(set_id: str, db: Session = Depends(get_db)):
    cards = db.query(Flashcard).filter(Flashcard.study_set_id == set_id).all()
    return [
        FlashcardResponse(
            id=c.id, question=c.question, answer=c.answer,
            explanation=c.explanation, mastery=c.mastery,
        )
        for c in cards
    ]


@router.post("/api/study-sets/{set_id}/flashcards/generate", response_model=list[FlashcardResponse], status_code=201)
def generate_flashcards(set_id: str, db: Session = Depends(get_db)):
    cards = gen_cards(set_id)
    if not cards:
        raise HTTPException(400, "Could not generate flashcards. Upload documents first.")
    return [
        FlashcardResponse(
            id=c["id"], question=c["question"], answer=c["answer"],
            explanation=c.get("explanation"), mastery=c.get("mastery", "unfamiliar"),
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
        id=card.id, question=card.question, answer=card.answer,
        explanation=card.explanation, mastery=card.mastery,
    )
