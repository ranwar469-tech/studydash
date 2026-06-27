"""Generate document summaries using AI."""

import json
from services.retrieval_service import retrieve_chunks
from services.ai_service import chat_completion


def generate_summary(study_set_id: str) -> dict:
    """Call AI to produce a structured summary from document chunks."""

    from database import SessionLocal
    from models import StudySet

    study_set = SessionLocal().query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        return {"content": "", "sections": [], "takeaways": []}

    chunks = retrieve_chunks("complete overview and key concepts of this material", study_set_id, top_k=15)
    if not chunks:
        return {"content": "", "sections": [], "takeaways": []}

    context = "\n\n".join(f"[{c['filename']} p.{c['page']}] {c['text']}" for c in chunks)

    prompt = (
        "Summarize the following study material. Provide a structured response with:\n"
        "1. An overview paragraph explaining the main topic\n"
        "2. Key takeaways as a list of bullet points\n"
        "3. Section breakdown with title and description for each major section\n"
        "Return ONLY valid JSON: "
        '{"overview": "...", "takeaways": ["..."], "sections": [{"title": "...", "desc": "..."}]}'
    )

    response = chat_completion(context, prompt).strip()
    response = response.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        result = json.loads(response)
        return {
            "content": result.get("overview", ""),
            "sections": result.get("sections", []),
            "takeaways": result.get("takeaways", []),
        }
    except json.JSONDecodeError:
        return {
            "content": response,
            "sections": [],
            "takeaways": [],
        }
