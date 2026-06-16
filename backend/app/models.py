from sqlalchemy import JSON, Column, Float, String, DateTime, Text, Integer, ForeignKey
from app.database import Base

import uuid
from datetime import UTC, datetime


from sqlalchemy import Column, String, Text, DateTime, ForeignKey


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.now(UTC))
    
    
    
class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    role = Column(String(100), nullable=False)

    difficulty = Column(String(20), nullable=False)

    status = Column(
        String(20),
        default="active"
    )
    total_score = Column(Float, nullable=True)
    created_at = Column(
        DateTime,
        default=datetime.now(UTC)
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )    
    
    resume_id = Column(
    String,
    ForeignKey("resumes.id"),
    nullable=True
)
    
class Question(Base):
    __tablename__ = "questions"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    session_id = Column(
        String,
        ForeignKey("interview_sessions.id"),
        nullable=False
    )

    question_text = Column(
        Text,
        nullable=False
    )

    question_order = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.now(UTC)

    )


class Answer(Base):
    __tablename__ = "answers"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    question_id = Column(
        String,
        ForeignKey("questions.id"),
        nullable=False
    )

    answer_text = Column(
        Text,
        nullable=False
    )

    score = Column(
        Integer,
        nullable=True
    )

    communication_score = Column(
        Integer,
        nullable=True
    )

    technical_depth_score = Column(
        Integer,
        nullable=True
    )

    problem_solving_score = Column(
        Integer,
        nullable=True
    )

    confidence_score = Column(
        Integer,
        nullable=True
    )

    feedback = Column(
        Text,
        nullable=True
    )

    strengths = Column(
        Text,
        nullable=True
    )

    improvements = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.now(UTC)
    )
    
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    filename = Column(String, nullable=False)

    extracted_text = Column(Text)

    skills = Column(JSON, nullable=True)

    projects = Column(JSON, nullable=True)

    uploaded_at = Column(
        DateTime,
        default=datetime.now(UTC)
    )