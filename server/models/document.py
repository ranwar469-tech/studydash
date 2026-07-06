import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    study_set_id = Column(String(36), ForeignKey("study_sets.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    chunk_count = Column(Integer, default=0)
    ocr_pages = Column(Integer, default=0)                     # how many pages needed OCR
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    study_set = relationship("StudySet", back_populates="documents")
