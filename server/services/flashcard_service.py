"""Generate flashcards from document content using AI."""

import json
from sqlalchemy import select, delete
from services.retrieval_service import get_all_chunks
from services.ai_service import structured_completion

FLASHCARD_SYSTEM = (
    "You are an expert educator who creates high-quality study flashcards. "
    "Your flashcards are conceptual, memorable, and promote deep understanding — "
    "not just rote memorization. Follow these rules:\n"
    "1. Questions should test understanding, not just recall. Use 'Why...', "
    "'How does...', 'Compare X and Y...', 'What would happen if...' formats.\n"
    "2. Answers should be concise but complete (2-4 sentences).\n"
    "3. Include a brief explanation that connects the concept to the bigger picture.\n"
    "4. Vary difficulty: mix foundational and advanced questions.\n"
    "5. Return ONLY a valid JSON array of objects with keys: question, answer, explanation."
)


async def generate_flashcards(study_set_id: str, document_ids: list[str] | None = None, count: int = 8) -> list[dict]:
    """Call AI to produce Q&A pairs from document chunks, then save to DB."""

    from database import SessionLocal
    from models import StudySet, Flashcard

    async with SessionLocal() as db:
        result = await db.execute(select(StudySet).where(StudySet.id == study_set_id))
        study_set = result.scalars().first()
        if not study_set:
            return []

    # Get ALL chunks for comprehensive coverage (no semantic filter)
    chunks = get_all_chunks(study_set_id, document_ids=document_ids, max_chunks=100)
    if not chunks:
        return []

    context = "\n\n".join(
        f"[{i+1}] ({c['filename']} p.{c['page']}) {c['text']}"
        for i, c in enumerate(chunks)
    )

    user_prompt = (
        f"Study Material:\n\n{context}\n\n"
        f"Generate exactly {count} high-quality flashcards from this material. Focus on:\n"
        "- Core concepts and their real-world significance\n"
        "- Relationships between ideas (cause/effect, compare/contrast)\n"
        "- Common misconceptions to address\n"
        "- Application of concepts to problem-solving\n\n"
        'Return ONLY a valid JSON array: [{"question": "...", "answer": "...", "explanation": "..."}]'
    )

    try:
        raw_json = structured_completion(FLASHCARD_SYSTEM, user_prompt)
        cards_data = json.loads(raw_json)
        if not isinstance(cards_data, list):
            raise ValueError("Expected a JSON array")
    except (json.JSONDecodeError, ValueError):
        print(f"[FlashcardService] JSON parse failed. Raw response:\n{raw_json[:500]}")
        return []

    async with SessionLocal() as db:
        # Delete old flashcards before regenerating
        await db.execute(delete(Flashcard).where(Flashcard.study_set_id == study_set_id))

        created = []
        for card in cards_data[:10]:
            f = Flashcard(
                study_set_id=study_set_id,
                question=card.get("question", ""),
                answer=card.get("answer", ""),
                explanation=card.get("explanation"),
            )
            db.add(f)
            created.append(f)
        await db.commit()
        for f in created:
            await db.refresh(f)

        return [
            {"id": f.id, "question": f.question, "answer": f.answer,
             "explanation": f.explanation, "mastery": f.mastery}
            for f in created
        ]
