import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from database import Base


class StudySet(Base):
    __tablename__ = "study_sets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False, default="General")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    documents = relationship("Document", back_populates="study_set", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="study_set", cascade="all, delete-orphan")
    quiz_questions = relationship("QuizQuestion", back_populates="study_set", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="study_set", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="study_set", cascade="all, delete-orphan")
