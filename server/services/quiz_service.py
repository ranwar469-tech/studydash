"""Generate quiz questions from document content using AI."""

import json
from services.retrieval_service import retrieve_chunks
from services.ai_service import chat_completion


def generate_quiz(study_set_id: str, num_questions: int = 5) -> list[dict]:
    """Call AI to produce multiple-choice questions from document chunks, then save to DB."""

    from database import SessionLocal
    from models import StudySet, QuizQuestion

    study_set = SessionLocal().query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        return []

    chunks = retrieve_chunks("all key concepts and important details in this material", study_set_id, top_k=10)
    if not chunks:
        return []

    context = "\n\n".join(f"[{c['filename']} p.{c['page']}] {c['text']}" for c in chunks)

    prompt = (
        f"Based on the following study material, generate {num_questions} multiple-choice questions. "
        "Each question should have exactly 4 options with one correct answer. "
        "Return ONLY valid JSON as an array of objects: "
        '[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..."}]'
    )

    response = chat_completion(context, prompt).strip()
    response = response.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        questions_data = json.loads(response)
    except json.JSONDecodeError:
        return []

    db = SessionLocal()
    created = []
    for q in questions_data[:num_questions]:
        qq = QuizQuestion(
            study_set_id=study_set_id,
            question=q.get("question", ""),
            options=json.dumps(q.get("options", ["", "", "", ""])),
            correct_index=q.get("correctIndex", 0),
            explanation=q.get("explanation", ""),
        )
        db.add(qq)
        created.append(qq)
    db.commit()
    for q in created:
        db.refresh(q)
    db.close()

    return [
        {"id": q.id, "question": q.question, "options": json.loads(q.options),
         "correctIndex": q.correct_index, "explanation": q.explanation}
        for q in created
    ]
