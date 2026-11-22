"""Run NexHire locally on a private demo database with sample data.

Your .env database is never used. The Gemini key from .env is used for live AI scoring if present.
Run from anywhere: python backend/scripts/run_demo.py
"""
import os
import subprocess
import sys
from datetime import timedelta
from pathlib import Path

import pgserver

BACKEND = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND / ".demo-db"
DATA_DIR.mkdir(exist_ok=True)

server = pgserver.get_server(DATA_DIR)
url = server.get_uri().replace("postgresql://", "postgresql+psycopg2://", 1)
# Both URLs are pinned to the local database before the app loads .env.
os.environ.update(
    DATABASE_URL=url,
    DIRECT_URL=url,
    SECRET_KEY="local-demo-secret-key-not-used-anywhere-else",
    CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173",
    AI_USER_RPM="30",
    DAILY_INTERVIEWS="100",
)
subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=BACKEND, check=True, capture_output=True)
os.chdir(BACKEND)
sys.path.insert(0, str(BACKEND))

import uvicorn  # noqa: E402

from app.auth import hash_password  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Answer, InterviewSession, Question, Resume, User, utcnow  # noqa: E402

EMAIL, PASSWORD = "demo@nexhire.dev", "demo12345"
SAMPLES = [
    ("SDE", "Easy", 24, [5, 6, 5, 6, 5], "database indexing"),
    ("Backend Developer", "Medium", 17, [6, 6, 7, 6, 7], "caching strategies"),
    ("SDE", "Medium", 11, [7, 6, 7, 8, 7], "concurrency control"),
    ("ML Engineer", "Medium", 6, [7, 8, 7, 7, 8], "data drift"),
    ("Backend Developer", "Hard", 2, [8, 8, 7, 9, 8], "caching strategies"),
]
QUESTIONS = [
    "How does a database index speed up reads, and when does it hurt performance?",
    "How would you design a rate limiter that works across multiple servers?",
    "What failure modes does a cache introduce, and how would you handle them?",
    "How would you prevent two users from buying the last item in stock?",
    "Walk me through what happens when a request reaches your API.",
]
SAMPLE_PROFILE = {
    "source": "ai",
    "skill_groups": [
        {"category": "Languages", "skills": ["Python", "JavaScript", "SQL"]},
        {"category": "Frameworks", "skills": ["React", "FastAPI"]},
        {"category": "Cloud", "skills": ["AWS", "Docker"]},
    ],
    "projects": [
        {
            "name": "TaskFlow",
            "summary": "A task platform built with React, FastAPI, PostgreSQL, and Redis.",
            "technologies": ["React", "FastAPI", "PostgreSQL", "Redis"],
            "claims": ["Built a task platform used by 500 students", "Reduced API latency by 40% using Redis caching"],
        },
        {
            "name": "FraudLens",
            "summary": "A fraud detection model served from a Docker container.",
            "technologies": ["Python", "PyTorch", "Docker"],
            "claims": ["Trained a fraud detection model with 92% recall"],
        },
    ],
    "experience": [
        {
            "title": "Software Engineering Intern",
            "organization": "Northwind Labs",
            "technologies": ["Node.js", "AWS Lambda"],
            "claims": ["Built REST APIs with Node.js and AWS Lambda"],
        }
    ],
    "education": [{"degree": "B.Tech Computer Science", "institution": "Example Institute of Technology"}],
}


def seed() -> None:
    with SessionLocal() as db:
        if db.query(User).filter_by(email=EMAIL).first():
            return
        user = User(email=EMAIL, name="Demo Candidate", hashed_password=hash_password(PASSWORD))
        db.add(user)
        db.flush()
        db.add(Resume(
            user_id=user.id, filename="sample-resume.pdf", extracted_text="Sample resume for the demo account.",
            skills=["Python", "React", "FastAPI"], projects=["TaskFlow", "FraudLens"], profile=SAMPLE_PROFILE,
        ))
        for role, difficulty, days_ago, scores, topic in SAMPLES:
            when = utcnow() - timedelta(days=days_ago)
            average = round(sum(scores) / len(scores), 2)
            session = InterviewSession(
                user_id=user.id, role=role, difficulty=difficulty, status="completed", created_at=when,
                completed_at=when, total_score=average, technical_depth_avg=average - 0.4, problem_solving_avg=average,
                communication_avg=min(average + 0.8, 10), confidence_avg=average - 0.7,
                summary="Sample report: clear structure overall. Next, explain failure modes and quantify trade-offs.",
            )
            for index, score in enumerate(scores):
                question = Question(session=session, question_text=QUESTIONS[index], question_order=index + 1)
                question.answer = Answer(
                    answer_text="Sample answer for the demo account.", score=score,
                    communication_score=min(score + 1, 10), technical_depth_score=score, problem_solving_score=score,
                    confidence_score=max(score - 1, 0),
                    feedback="Sample feedback: good structure, but add a concrete example and a trade-off.",
                    strengths=["Clear, structured explanation"], improvements=["Discuss failure modes"],
                    weak_topics=[topic], created_at=when,
                )
            db.add(session)
        db.commit()


seed()
print(f"\nNexHire API is ready at http://127.0.0.1:8000\nDemo login: {EMAIL} / {PASSWORD}\n", flush=True)
uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
