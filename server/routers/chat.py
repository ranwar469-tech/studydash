import json
import re
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from limiter import limiter
from database import get_db
from models import StudySet, ChatMessage
from schemas import ChatMessageResponse, ChatRequest
from services.retrieval_service import retrieve_chunks, get_all_chunks
from services.ai_service import stream_chat

router = APIRouter(tags=["chat"])


@router.get("/api/study-sets/{set_id}/chat", response_model=list[ChatMessageResponse])
@limiter.limit("60/minute")
async def get_chat_history(request: Request, set_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudySet).where(StudySet.id == set_id))
    study_set = result.scalars().first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.study_set_id == set_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    return [
        ChatMessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            sources=json.loads(m.sources) if m.sources else None,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/api/study-sets/{set_id}/chat")
@limiter.limit("10/minute")
async def send_message(request: Request, set_id: str, data: ChatRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudySet).where(StudySet.id == set_id))
    study_set = result.scalars().first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    # 1. Save user message
    user_msg = ChatMessage(study_set_id=set_id, role="user", content=data.message)
    db.add(user_msg)
    await db.commit()

    # 2. Detect question type and choose retrieval strategy
    #
    # For broad-coverage questions (summarization, listing topics, overviews),
    # use get_all_chunks() to give the LLM the full document.
    # For specific Q&A, use retrieve_chunks() for targeted semantic search.

    broad_patterns = [
        r"\bsummar(y|ize|ise)\b", r"\boverview\b", r"\bmain (idea|topic|concept|point)s?\b",
        r"\bkey (idea|topic|concept|point|takeaway)s?\b", r"\blist (all|the) (topic|concept|idea)s?\b",
        r"\bwhat (does|do) (this|the) (document|chapter|text|material|notes) (cover|contain|include|talk about)\b",
        r"\bgive me (an|a) (overview|summary|rundown)\b", r"\bwhat (is|are) the main\b",
        r"\boutline\b", r"\btopics covered\b",
    ]
    is_broad = any(re.search(p, data.message.lower()) for p in broad_patterns)

    if is_broad:
        # Comprehensive: grab up to 50 chunks (well-distributed sample of the full doc)
        chunks = get_all_chunks(set_id, document_ids=data.document_ids, max_chunks=50)
    else:
        # Targeted: semantic search for the most relevant 5 chunks
        pages = [int(m) for m in re.findall(r"\bpage\s+(\d+)\b", data.message, re.IGNORECASE)]
        pages += [int(m) for m in re.findall(r"\bp\.?\s*(\d+)\b", data.message, re.IGNORECASE)]
        chunks = retrieve_chunks(data.message, set_id, document_ids=data.document_ids, pages=pages if pages else None)
    context_parts = []
    source_list = []
    seen_sources = set()  # deduplicate by (filename, page)
    for i, c in enumerate(chunks):
        key = (c['filename'], c['page'])
        context_parts.append(f"[Chunk {i+1}] ({c['filename']} p.{c['page']}) {c['text']}")
        if key not in seen_sources:
            seen_sources.add(key)
            source_list.append({
            "chunk_id": i + 1,
            "filename": c["filename"],
            "page": c["page"],
            "document_id": c.get("document_id", ""),
            "chunk_text": c["text"],
        })
    context_text = "\n\n".join(context_parts) if context_parts else "No relevant context found in the uploaded documents."
    sources_json = json.dumps(source_list) if source_list else None

    # 3. Build conversation history (last 3 exchanges = 6 messages)
    result_prev = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.study_set_id == set_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(6)
    )
    previous = result_prev.scalars().all()
    history = [
        {"role": m.role, "content": m.content}
        for m in reversed(previous)  # chronological order
    ]

    # 4. Save placeholder assistant message FIRST (so it survives crashes)
    assistant_msg = ChatMessage(
        study_set_id=set_id,
        role="assistant",
        content="",
        sources=sources_json,
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    # 5. Stream the real response via async SSE
    async def event_stream():
        full_content = ""
        try:
            async for token in stream_chat(
                context=context_text,
                question=data.message,
                mode=data.mode,
                history=history,
            ):
                full_content += token
                yield f"data: {json.dumps(token)}\n\n"

            # Send sources after content
            if source_list:
                yield f"data: [SOURCES]{json.dumps(source_list)}\n\n"

            yield "data: [DONE]\n\n"

            # Update the placeholder with the real content
            assistant_msg.content = full_content
            await db.commit()

        except Exception:
            # Update with error content so user sees what happened
            if full_content:
                assistant_msg.content = full_content
            else:
                assistant_msg.content = "Sorry, I encountered an error generating a response. Please try again."
            await db.commit()
            yield f"data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
