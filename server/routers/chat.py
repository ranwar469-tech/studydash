import json
import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import StudySet, ChatMessage
from schemas import ChatMessageResponse, ChatRequest

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

    # Save user message
    user_msg = ChatMessage(study_set_id=set_id, role="user", content=data.message)
    db.add(user_msg)
    db.commit()

    # TODO: RAG pipeline
    # 1. Embed the question via DeepSeek
    # 2. Query ChromaDB collection set_{set_id} → top-k chunks
    # 3. Build prompt with context chunks
    # 4. Call DeepSeek chat API
    # 5. Return SSE stream of tokens
    #
    # For now, return a placeholder streaming response

    placeholder = (
        "Great question! Based on your study materials, here's what I can tell you about "
        f"\"{data.message}\".\n\n"
        "This is a placeholder response. The RAG pipeline will be connected soon. "
        "Once integrated, I'll search through your uploaded documents to give you "
        "a grounded answer with citations.\n\n"
        "**Study tips:** Try uploading a PDF first, then ask questions about it!"
    )

    async def stream():
        for char in placeholder:
            yield f"data: {char}\n\n"
            time.sleep(0.015)
        yield "data: [DONE]\n\n"

    # Save placeholder assistant message
    assistant_msg = ChatMessage(study_set_id=set_id, role="assistant", content=placeholder)
    db.add(assistant_msg)
    db.commit()

    return StreamingResponse(stream(), media_type="text/event-stream")
