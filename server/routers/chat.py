import json
import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet, ChatMessage
from schemas import ChatMessageResponse, ChatRequest
from services.retrieval_service import retrieve_chunks
from services.ai_service import chat_completion

router = APIRouter(tags=["chat"])


@router.get("/api/study-sets/{set_id}/chat", response_model=list[ChatMessageResponse])
def get_chat_history(set_id: str, db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.study_set_id == set_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
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
def send_message(set_id: str, data: ChatRequest, db: Session = Depends(get_db)):
    study_set = db.query(StudySet).filter(StudySet.id == set_id).first()
    if not study_set:
        raise HTTPException(404, "Study set not found")

    user_msg = ChatMessage(study_set_id=set_id, role="user", content=data.message)
    db.add(user_msg)
    db.commit()

    chunks = retrieve_chunks(data.message, set_id, document_ids=data.document_ids)
    context_parts = []
    source_list = []
    for c in chunks:
        context_parts.append(f"[{c['filename']} p.{c['page']}] {c['text']}")
        source_list.append({"filename": c["filename"], "page": c["page"], "chunk_text": c["text"]})
    context_text = "\n\n".join(context_parts) if context_parts else "No relevant context found in the uploaded documents."
    sources_json = json.dumps(source_list) if source_list else None

    # Get the full response from DeepSeek (sync call)
    response = chat_completion(context_text, data.message)

    def event_stream():
        for char in response:
            yield f"data: {char}\n\n"
            time.sleep(0.005)

        if source_list:
            yield f"data: [SOURCES]{json.dumps(source_list)}\n\n"

        yield "data: [DONE]\n\n"

        # Save assistant message — runs in the same thread as the request
        assistant_msg = ChatMessage(
            study_set_id=set_id,
            role="assistant",
            content=response,
            sources=sources_json,
        )
        db.add(assistant_msg)
        db.commit()

    return StreamingResponse(event_stream(), media_type="text/event-stream")
