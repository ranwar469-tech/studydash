"""Generate document summaries using AI with map-reduce for full coverage.

Instead of semantically retrieving a few chunks (which misses most of the document),
this service uses a map-reduce pipeline:
  1. Get ALL chunks from ChromaDB (no semantic filter)
  2. Split into batches of ~15 chunks
  3. Summarize each batch independently (the "map" step)
  4. Merge all batch summaries into a final structured summary (the "reduce" step)

This ensures every part of the document is accounted for in the final summary.
"""

import json
from sqlalchemy import select
from services.retrieval_service import get_all_chunks
from services.ai_service import structured_completion

BATCH_SYSTEM = (
    "You are an expert academic summarizer. Summarize the provided chunk of a larger document. "
    "Focus ONLY on the actual subject content — ignore syllabi, grading policies, "
    "course logistics, and administrative notes. "
    "Return ONLY valid JSON: {\"title\": \"brief topic title\", \"points\": [\"key point 1\", \"key point 2\", ...], "
    "\"concepts\": [\"concept 1\", \"concept 2\", ...]}"
)

MERGE_SYSTEM = (
    "You are an expert academic summarizer who creates clear, well-organized study summaries. "
    "Your summaries help students quickly grasp the key ideas of complex material. Follow these rules:\n"
    "1. Write a clear overview paragraph (3-5 sentences) that captures the main theme across ALL topics.\n"
    "2. List 5-8 key takeaways — each should be a standalone insight a student should remember.\n"
    "3. Break content into logical sections with descriptive titles and 1-2 sentence descriptions.\n"
    "4. Cover ALL topics provided in the batch summaries — don't drop any major section.\n"
    "5. Return ONLY valid JSON: {\"overview\": \"...\", \"takeaways\": [\"...\"], \"sections\": [{\"title\": \"...\", \"desc\": \"...\"}]}"
)

BATCH_SIZE = 15
MAX_CHUNKS_TOTAL = 150


async def generate_summary(study_set_id: str, document_ids: list[str] | None = None) -> dict:
    """Map-reduce summarization: get all chunks → batch-summarize → merge."""

    from database import SessionLocal
    from models import StudySet, Summary

    async with SessionLocal() as db:
        result = await db.execute(select(StudySet).where(StudySet.id == study_set_id))
        study_set = result.scalars().first()
        if not study_set:
            return {"content": "", "sections": [], "takeaways": []}

        # ── Step 1: Get ALL chunks (no semantic filter — full coverage) ──
        all_chunks = get_all_chunks(study_set_id, document_ids=document_ids, max_chunks=MAX_CHUNKS_TOTAL)
        if not all_chunks:
            return {"content": "", "sections": [], "takeaways": []}

        # ── Step 2: Split into batches ──
        batches = [
            all_chunks[i : i + BATCH_SIZE]
            for i in range(0, len(all_chunks), BATCH_SIZE)
        ]

        # ── Step 3: Summarize each batch (the "map" step) ──
        batch_summaries = []
        for batch_idx, batch in enumerate(batches):
            batch_text = "\n\n".join(
                f"[{c['filename']} p.{c['page']}] {c['text']}" for c in batch
            )
            user_prompt = (
                f"Document excerpt (batch {batch_idx + 1} of {len(batches)}):\n\n{batch_text}\n\n"
                "Extract the key points and concepts from this excerpt. "
                'Return ONLY valid JSON: {"title": "...", "points": [...], "concepts": [...]}'
            )
            try:
                raw = structured_completion(BATCH_SYSTEM, user_prompt)
                batch_summaries.append(json.loads(raw))
            except (json.JSONDecodeError, ValueError):
                print(f"[SummaryService] Batch {batch_idx + 1} JSON parse failed, skipping")
                continue

        if not batch_summaries:
            return {"content": "", "sections": [], "takeaways": []}

        # ── Step 4: Merge batch summaries (the "reduce" step) ──
        summaries_text = json.dumps(batch_summaries, indent=2)
        merge_prompt = (
            f"Below are summaries of {len(batch_summaries)} sections from a document. "
            f"Combine them into one coherent study summary.\n\n{summaries_text}\n\n"
            "Create a unified summary covering ALL sections. "
            'Return ONLY valid JSON: {"overview": "...", "takeaways": [...], '
            '"sections": [{"title": "...", "desc": "..."}]}'
        )

        try:
            raw = structured_completion(MERGE_SYSTEM, merge_prompt)
            result = json.loads(raw)
            if not isinstance(result, dict):
                raise ValueError("Expected a JSON object")
        except (json.JSONDecodeError, ValueError):
            print("[SummaryService] Merge JSON parse failed.")
            result = {"overview": "Could not generate summary.", "sections": [], "takeaways": []}

        # ── Step 5: Persist ──
        existing = (
            await db.execute(select(Summary).where(Summary.study_set_id == study_set_id))
        ).scalars().first()
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

        await db.commit()
        return {
        "content": result.get("overview", ""),
        "sections": result.get("sections", []),
        "takeaways": result.get("takeaways", []),
    }


async def get_summary(study_set_id: str) -> dict | None:
    """Retrieve the saved summary from the database."""

    from database import SessionLocal
    from models import Summary

    async with SessionLocal() as db:
        result = await db.execute(select(Summary).where(Summary.study_set_id == study_set_id))
        existing = result.scalars().first()
    if existing:
        return {
            "content": existing.overview,
            "sections": json.loads(existing.sections),
            "takeaways": json.loads(existing.takeaways),
        }
    return None
