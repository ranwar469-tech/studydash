"""Generate document summaries using AI and persist to local DB."""

import json
from services.retrieval_service import retrieve_chunks
from services.ai_service import chat_completion


def generate_summary(study_set_id: str, document_ids: list[str] | None = None) -> dict:
    """Call AI to produce a structured summary, then save to DB."""

    from database import SessionLocal
    from models import StudySet, Summary

    db = SessionLocal()
    study_set = db.query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        db.close()
        return {"content": "", "sections": [], "takeaways": []}

    chunks = retrieve_chunks("academic concepts definitions formulas principles theories key ideas", study_set_id, top_k=25, document_ids=document_ids)
    if not chunks:
        db.close()
        return {"content": "", "sections": [], "takeaways": []}

    context = "\n\n".join(f"[{c['filename']} p.{c['page']}] {c['text']}" for c in chunks)

    prompt = (
        "Summarize the following study material focusing ONLY on the actual subject content. "
        "IGNORE any syllabus information, course expectations, grading policies, or administrative notes. "
        "Provide a structured response with:\n"
        "1. An overview paragraph explaining the main academic concepts covered\n"
        "2. Key takeaways as a list of bullet points about the subject matter\n"
        "3. Section breakdown with title and description for each major topic in the material\n"
        "Return ONLY valid JSON: "
        '{"overview": "...", "takeaways": ["..."], "sections": [{"title": "...", "desc": "..."}]}'
    )

    response = chat_completion(context, prompt).strip()
    response = response.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        print(f"[SummaryService] JSON parse failed. Raw response:\n{response[:500]}")
        result = {"overview": response, "sections": [], "takeaways": []}

    existing = db.query(Summary).filter(Summary.study_set_id == study_set_id).first()
    if existing:
        existing.overview = result.get("overview", "")
        existing.sections = json.dumps(result.get("sections", []))
        existing.takeaways = json.dumps(result.get("takeaways", []))
    else:
        s = Summary(
            study_set_id=study_set_id,
            overview=result.get("overview", ""),
            sections=json.dumps(result.get("sections", [])),
            takeaways=json.dumps(result.get("takeaways", [])),
        )
        db.add(s)

    db.commit()
    db.close()
    return {"content": result.get("overview", ""), "sections": result.get("sections", []), "takeaways": result.get("takeaways", [])}


def get_summary(study_set_id: str) -> dict | None:
    """Retrieve the saved summary from the database."""

    from database import SessionLocal
    from models import Summary

    db = SessionLocal()
    existing = db.query(Summary).filter(Summary.study_set_id == study_set_id).first()
    db.close()
    if existing:
        return {
            "content": existing.overview,
            "sections": json.loads(existing.sections),
            "takeaways": json.loads(existing.takeaways),
        }
    return None
