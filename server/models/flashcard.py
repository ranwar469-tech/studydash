import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    study_set_id = Column(String(36), ForeignKey("study_sets.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    mastery = Column(String(20), default="unfamiliar")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    study_set = relationship("StudySet", back_populates="flashcards")
