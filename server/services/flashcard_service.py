"""Generate flashcards from document content using AI."""

import json
from services.retrieval_service import retrieve_chunks
from services.ai_service import chat_completion


def generate_flashcards(study_set_id: str) -> list[dict]:
    """Call AI to produce Q&A pairs from document chunks, then save to DB."""

    from database import SessionLocal
    from models import StudySet, Flashcard

    study_set = SessionLocal().query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        return []

    chunks = retrieve_chunks("all key concepts in this material", study_set_id, top_k=10)
    if not chunks:
        return []

    context = "\n\n".join(f"[{c['filename']} p.{c['page']}] {c['text']}" for c in chunks)

    prompt = (
        "Based on the following study material, generate Q&A flashcards. "
        "Each flashcard should have a question, answer, and optional explanation. "
        "Make questions that test understanding, not just memorization. "
        "Return ONLY valid JSON as an array of objects: "
        '[{"question": "...", "answer": "...", "explanation": "..."}]'
    )

    response = chat_completion(context, prompt).strip()
    response = response.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        cards_data = json.loads(response)
    except json.JSONDecodeError:
        return []

    db = SessionLocal()
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
    db.commit()
    for f in created:
        db.refresh(f)
    db.close()

    return [
        {"id": f.id, "question": f.question, "answer": f.answer,
         "explanation": f.explanation, "mastery": f.mastery}
        for f in created
    ]
