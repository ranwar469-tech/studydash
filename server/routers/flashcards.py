from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from limiter import limiter
from database import get_db
from models import Flashcard
from schemas import FlashcardResponse, FlashcardMasteryUpdate
from services.flashcard_service import generate_flashcards as gen_cards
from pydantic import BaseModel

router = APIRouter(tags=["flashcards"])


class GenerateRequest(BaseModel):
    document_ids: list[str] | None = None
    count: int = 8  # 5 (low), 8 (medium), 12 (high)


@router.get("/api/study-sets/{set_id}/flashcards", response_model=list[FlashcardResponse])
@limiter.limit("30/minute")
async def list_flashcards(request: Request, set_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Flashcard).where(Flashcard.study_set_id == set_id))
    cards = result.scalars().all()
    return [
        FlashcardResponse(
            id=c.id, question=c.question, answer=c.answer,
            explanation=c.explanation, mastery=c.mastery,
        )
        for c in cards
    ]


@router.post("/api/study-sets/{set_id}/flashcards/generate", response_model=list[FlashcardResponse], status_code=201)
@limiter.limit("5/minute")
async def generate_flashcards(request: Request, set_id: str, body: GenerateRequest = GenerateRequest(), db: AsyncSession = Depends(get_db)):
    cards = await gen_cards(set_id, document_ids=body.document_ids, count=body.count)
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
@limiter.limit("30/minute")
async def update_flashcard_mastery(request: Request, card_id: str, data: FlashcardMasteryUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Flashcard).where(Flashcard.id == card_id))
    card = result.scalars().first()
    if not card:
        raise HTTPException(404, "Flashcard not found")
    card.mastery = data.mastery
    await db.commit()
    await db.refresh(card)
    return FlashcardResponse(
        id=card.id, question=card.question, answer=card.answer,
        explanation=card.explanation, mastery=card.mastery,
    )
