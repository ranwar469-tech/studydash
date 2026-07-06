"""Generate quiz questions from document content using AI."""

import json
from sqlalchemy import select, delete
from services.retrieval_service import get_all_chunks
from services.ai_service import structured_completion

QUIZ_SYSTEM = (
    "You are an expert exam writer who creates high-quality multiple-choice quiz questions. "
    "Your questions test deep understanding, not trivial recall. Follow these rules:\n"
    "1. Each question must have exactly 4 options (A, B, C, D).\n"
    "2. All distractors (wrong answers) must be plausible but clearly wrong to someone who "
    "understands the material — include a brief rationale for why each distractor is wrong.\n"
    "3. The correct answer must be unambiguously right based on the provided material.\n"
    "4. Include a thorough explanation that teaches the concept, not just states the answer.\n"
    "5. Vary question types: definition, application, comparison, cause/effect, analysis.\n"
    "6. Return ONLY a valid JSON array of objects with keys: question, options (array of 4 strings), "
    "correctIndex (0-3), explanation."
)


async def generate_quiz(study_set_id: str, num_questions: int = 5, document_ids: list[str] | None = None) -> list[dict]:
    """Call AI to produce multiple-choice questions from document chunks, then save to DB."""

    from database import SessionLocal
    from models import StudySet, QuizQuestion

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
        f"Generate exactly {num_questions} multiple-choice quiz questions. Requirements:\n"
        "- Test understanding of core concepts, their applications, and relationships\n"
        "- Include at least one question that requires comparing/contrasting two concepts\n"
        "- Include at least one question that tests application to a scenario\n"
        "- Each question: 4 options, 1 correct, with explanation that teaches\n\n"
        'Return ONLY a valid JSON array: '
        '[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..."}]'
    )

    try:
        raw_json = structured_completion(QUIZ_SYSTEM, user_prompt)
        questions_data = json.loads(raw_json)
        if not isinstance(questions_data, list):
            raise ValueError("Expected a JSON array")
    except (json.JSONDecodeError, ValueError):
        print(f"[QuizService] JSON parse failed.")
        return []

    async with SessionLocal() as db:
        # Delete old quiz questions before regenerating
        await db.execute(delete(QuizQuestion).where(QuizQuestion.study_set_id == study_set_id))

        created = []
        for q in questions_data[:num_questions]:
            options = q.get("options", ["", "", "", ""])
            if len(options) != 4:
                continue
            qq = QuizQuestion(
                study_set_id=study_set_id,
                question=q.get("question", ""),
                options=json.dumps(options),
                correct_index=q.get("correctIndex", 0),
                explanation=q.get("explanation", ""),
            )
            db.add(qq)
            created.append(qq)
        await db.commit()
        for q in created:
            await db.refresh(q)

        return [
            {"id": q.id, "question": q.question, "options": json.loads(q.options),
             "correctIndex": q.correct_index, "explanation": q.explanation}
            for q in created
        ]
