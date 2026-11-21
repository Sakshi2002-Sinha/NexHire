import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base

JsonList = JSON().with_variant(JSONB(), "postgresql")


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Naive UTC, matching the existing TIMESTAMP columns. Passed as a callable so it runs per row."""
    return datetime.now(UTC).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_id)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=utcnow)


class Resume(Base):
    __tablename__ = "resumes"
    __table_args__ = (Index("ix_resumes_user_id", "user_id"),)

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    extracted_text = Column(Text)
    skills = Column(JSON, nullable=True)
    projects = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=utcnow)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    __table_args__ = (
        Index("ix_sessions_user_created", "user_id", "created_at"),
        # The database itself guarantees at most one active interview per user.
        Index(
            "uq_one_active_session_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
            sqlite_where=text("status = 'active'"),
        ),
    )

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(100), nullable=False)
    difficulty = Column(String(20), nullable=False)
    status = Column(String(20), default="active")  # active | completed | abandoned
    total_score = Column(Float, nullable=True)
    communication_avg = Column(Float, nullable=True)
    technical_depth_avg = Column(Float, nullable=True)
    problem_solving_avg = Column(Float, nullable=True)
    confidence_avg = Column(Float, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)
    resume_id = Column(String, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    questions = relationship(
        "Question",
        back_populates="session",
        order_by="Question.question_order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    resume = relationship("Resume")


class Question(Base):
    __tablename__ = "questions"
    # Also serves as the lookup index, and stops concurrent requests creating the same next question.
    __table_args__ = (UniqueConstraint("session_id", "question_order", name="uq_questions_session_order"),)

    id = Column(String, primary_key=True, default=new_id)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_order = Column(Integer, nullable=False)
    is_followup = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    created_at = Column(DateTime, default=utcnow)

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship(
        "Answer",
        back_populates="question",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=new_id)
    # unique=True makes double submits safe, even from two tabs at once.
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, unique=True)
    answer_text = Column(Text, nullable=False)
    score = Column(Integer, nullable=True)
    communication_score = Column(Integer, nullable=True)
    technical_depth_score = Column(Integer, nullable=True)
    problem_solving_score = Column(Integer, nullable=True)
    confidence_score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    strengths = Column(JsonList, nullable=True)
    improvements = Column(JsonList, nullable=True)
    weak_topics = Column(JsonList, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    question = relationship("Question", back_populates="answer")
