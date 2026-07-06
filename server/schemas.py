from datetime import datetime
from pydantic import BaseModel


class StudySetCreate(BaseModel):
    title: str
    subject: str = "General"


class StudySetUpdate(BaseModel):
    title: str | None = None
    subject: str | None = None


class StudySetResponse(BaseModel):
    id: str
    title: str
    subject: str
    document_count: int = 0
    created_at: datetime
    updated_at: datetime


class DocumentResponse(BaseModel):
    id: str
    study_set_id: str
    study_set_title: str = ""
    filename: str
    chunk_count: int
    ocr_pages: int = 0
    uploaded_at: datetime


class FlashcardResponse(BaseModel):
    id: str
    question: str
    answer: str
    explanation: str | None = None
    mastery: str = "unfamiliar"


class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
    explanation: str


class QuizSubmitRequest(BaseModel):
    answers: list[dict]


class QuizSubmitResponse(BaseModel):
    score: int
    total: int


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: list[dict] | None = None
    created_at: datetime


class ChatRequest(BaseModel):
    message: str
    mode: str | None = None  # 'beginner' | 'exam' | 'deep' | 'quick' | 'default'
    document_ids: list[str] | None = None


class NoteCreate(BaseModel):
    title: str
    content: str


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class NoteResponse(BaseModel):
    id: str
    study_set_id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime


class SummaryResponse(BaseModel):
    content: str
    sections: list[dict]
    takeaways: list[str]


class FlashcardMasteryUpdate(BaseModel):
    mastery: str
