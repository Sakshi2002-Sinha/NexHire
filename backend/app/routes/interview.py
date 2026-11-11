import random
from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.dependencies import get_db
from app.models import User, InterviewSession, Question, Answer, Resume
from app.schemas import (
    InterviewStartRequest,
    InterviewStartResponse,
    AnswerRequest,
    AnswerResponse,
    InterviewEndRequest,
    InterviewEndResponse,
    InterviewDetailResponse,
    QuestionAnswerDetail,
)
from app.services.gemini_service import generate_question, evaluate_answer
from app.services.resume_parser import extract_skills, extract_projects
from app.services.resume_services import extract_text_from_pdf
from app.utils import dump_list, load_list

FALLBACK_QUESTIONS = [
    "Explain REST vs GraphQL.",
    "What is database indexing and why is it important?",
    "What is dependency injection?",
    "What is JWT authentication and how does it work?",
    "What is the difference between SQL and NoSQL databases?",
    "Explain database normalization.",
    "What are ACID properties in databases?",
    "What is caching and where would you use Redis?",
    "Explain optimistic locking and pessimistic locking.",
    "What is a database transaction?",
    "What is the N+1 query problem?",
    "How would you design a URL shortening service?",
    "What is load balancing and why is it needed?",
    "Explain horizontal scaling vs vertical scaling.",
    "What is the difference between synchronous and asynchronous programming?",
    "How do microservices communicate with each other?",
    "What is a message queue and when would you use RabbitMQ or Kafka?",
    "How would you prevent race conditions in an e-commerce inventory system?",
    "What is connection pooling in databases?",
    "Explain the lifecycle of an HTTP request in a web application.",
    "What is API rate limiting and how can it be implemented?",
    "What are database indexes and their trade-offs?",
    "How would you secure a REST API?",
    "What is the difference between authentication and authorization?",
    "How would you design a real-time chat application?",
]

ROLE_FALLBACK_QUESTIONS = {
    "ML Engineer": [
        "Explain the bias-variance tradeoff.",
        "How do you detect and handle overfitting?",
        "How would you deploy and monitor a model in production?",
        "Explain precision, recall, and when you'd optimise for each.",
        "How do you handle class imbalance in a dataset?",
        "What is data leakage and how do you prevent it?",
        "Explain how gradient descent works and common variants.",
    ],
    "Product Manager": [
        "How would you prioritise features for the next quarter?",
        "Which metrics would you track for a ride-sharing app?",
        "Tell me about a product you love and how you'd improve it.",
        "How would you decide whether to launch a feature after an A/B test?",
        "How do you handle disagreement between engineering and design?",
        "Daily active users dropped 10% last week. How do you investigate?",
        "How would you design a product for first-time smartphone users?",
    ],
}

MAX_QUESTIONS = 5

router = APIRouter(prefix="/interview", tags=["Interview"])


def _next_question_text(role, difficulty, history, resume):
    """Ask Gemini for a new question; fall back to an unused canned one."""
    text = generate_question(
        role=role,
        difficulty=difficulty,
        history=history,
        resume=resume,
    )

    if text and text not in history:
        return text

    pool = ROLE_FALLBACK_QUESTIONS.get(role, FALLBACK_QUESTIONS)
    unused = [q for q in pool if q not in history]
    return random.choice(unused or pool)


def _get_user_session(db, session_id, user_id):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id,
        )
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.post("/start", response_model=InterviewStartResponse)
def start_interview(
    data: InterviewStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = None
    if data.resume_id:
        resume = (
            db.query(Resume)
            .filter(
                Resume.id == data.resume_id,
                Resume.user_id == current_user.id,
            )
            .first()
        )
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

    session = InterviewSession(
        user_id=current_user.id,
        role=data.role,
        difficulty=data.difficulty,
        resume_id=resume.id if resume else None,
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    question = Question(
        session_id=session.id,
        question_text=_next_question_text(data.role, data.difficulty, [], resume),
        question_order=1,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return InterviewStartResponse(
        session_id=session.id,
        question_id=question.id,
        question=question.question_text,
    )


@router.post("/answer", response_model=AnswerResponse)
def answer_question(
    data: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_user_session(db, data.session_id, current_user.id)

    if session.status != "active":
        raise HTTPException(status_code=400, detail="Interview is already finished")

    question = (
        db.query(Question)
        .filter(
            Question.id == data.question_id,
            Question.session_id == session.id,
        )
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    already_answered = (
        db.query(Answer).filter(Answer.question_id == question.id).first()
    )
    if already_answered:
        raise HTTPException(status_code=409, detail="Question already answered")

    result = evaluate_answer(
        question=question.question_text,
        answer=data.answer,
        role=session.role,
    )

    answer = Answer(
        question_id=question.id,
        answer_text=data.answer,
        score=result["score"],
        communication_score=result["communication"],
        technical_depth_score=result["technical_depth"],
        problem_solving_score=result["problem_solving"],
        confidence_score=result["confidence"],
        feedback=result["feedback"],
        strengths=dump_list(result["strengths"]),
        improvements=dump_list(result["improvements"]),
    )
    db.add(answer)
    db.commit()

    previous_questions = (
        db.query(Question)
        .filter(Question.session_id == session.id)
        .order_by(Question.question_order)
        .all()
    )

    next_question = None
    if len(previous_questions) < MAX_QUESTIONS:
        resume = None
        if session.resume_id:
            resume = db.query(Resume).filter(Resume.id == session.resume_id).first()

        history = [q.question_text for q in previous_questions]

        next_question = Question(
            session_id=session.id,
            question_text=_next_question_text(
                session.role, session.difficulty, history, resume
            ),
            question_order=len(previous_questions) + 1,
        )
        db.add(next_question)
        db.commit()
        db.refresh(next_question)

    return AnswerResponse(
        score=result["score"],
        communication=result["communication"],
        technical_depth=result["technical_depth"],
        problem_solving=result["problem_solving"],
        confidence=result["confidence"],
        feedback=result["feedback"],
        strengths=result["strengths"],
        improvements=result["improvements"],
        next_question_id=next_question.id if next_question else None,
        next_question=next_question.question_text if next_question else None,
    )


@router.post("/end", response_model=InterviewEndResponse)
def end_interview(
    data: InterviewEndRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_user_session(db, data.session_id, current_user.id)

    answers = (
        db.query(Answer)
        .join(Question, Answer.question_id == Question.id)
        .filter(Question.session_id == session.id)
        .all()
    )

    scores = [a.score for a in answers if a.score is not None]
    total_score = round(sum(scores) / len(scores), 2) if scores else 0

    strengths = []
    improvements = []
    for a in answers:
        strengths.extend(load_list(a.strengths))
        improvements.extend(load_list(a.improvements))

    if session.status != "completed":
        session.status = "completed"
        session.completed_at = datetime.now(UTC)
    session.total_score = total_score
    db.commit()

    return InterviewEndResponse(
        session_id=session.id,
        total_score=total_score,
        strengths=strengths,
        improvements=improvements,
    )


@router.get("/{session_id}", response_model=InterviewDetailResponse)
def get_interview_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_user_session(db, session_id, current_user.id)

    questions = (
        db.query(Question)
        .filter(Question.session_id == session.id)
        .order_by(Question.question_order)
        .all()
    )

    answers = (
        db.query(Answer)
        .filter(Answer.question_id.in_([q.id for q in questions]))
        .all()
        if questions
        else []
    )
    answer_by_question = {a.question_id: a for a in answers}

    question_details = []
    for question in questions:
        answer = answer_by_question.get(question.id)
        question_details.append(
            QuestionAnswerDetail(
                question_id=question.id,
                question=question.question_text,
                question_order=question.question_order,
                answer=answer.answer_text if answer else None,
                score=answer.score if answer else None,
                communication=answer.communication_score if answer else None,
                technical_depth=answer.technical_depth_score if answer else None,
                problem_solving=answer.problem_solving_score if answer else None,
                confidence=answer.confidence_score if answer else None,
                feedback=answer.feedback if answer else None,
                strengths=load_list(answer.strengths) if answer else [],
                improvements=load_list(answer.improvements) if answer else [],
            )
        )

    return InterviewDetailResponse(
        session_id=session.id,
        role=session.role,
        difficulty=session.difficulty,
        status=session.status,
        score=session.total_score,
        questions=question_details,
    )


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    try:
        text = extract_text_from_pdf(file.file)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read this PDF")

    skills = extract_skills(text)
    projects = extract_projects(text)

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        extracted_text=text,
        skills=skills,
        projects=projects,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "skills": skills,
        "projects": projects,
        "preview": text[:300],
    }
