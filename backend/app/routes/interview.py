from datetime import datetime, UTC
from app.models import Resume

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from fastapi import APIRouter
from sqlalchemy.orm import Session
import random


from app.models import (
    User,
    InterviewSession,
    Question,
    Answer,
    Resume
    
)

from app.schemas import (
    InterviewStartRequest,
    InterviewStartResponse,
    AnswerRequest,
    AnswerResponse,
    InterviewEndRequest,
    InterviewEndResponse,
    InterviewDetailResponse,
    QuestionAnswerDetail
)

from app.services.gemini_service import (
    generate_question,
    evaluate_answer
)
from app.services.resume_parser import (
    extract_skills,
    extract_projects
)
from pydoc import text
from app.dependencies import get_db
from app.auth import get_current_user

from app.services.resume_services import extract_text_from_pdf

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
    "How would you design a real-time chat application?"
]
# -----------------------------------------------------------------------
MAX_QUESTIONS = 5
# --------------------------------------------------------------------------
router = APIRouter(
    prefix="/interview",
    tags=["Interview"]
)



@router.post(
    "/start",
    response_model=InterviewStartResponse
)
def start_interview(
    data: InterviewStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create interview session
    session = InterviewSession(
    user_id=current_user.id,
    role=data.role,
    difficulty=data.difficulty,
    resume_id=data.resume_id,
    status="active"
)

    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate first question
    resume = None

    if data.resume_id:

        resume = db.query(Resume).filter(
            Resume.id == data.resume_id
        ).first()

    resume = None

    if data.resume_id:

        resume = (
            db.query(Resume)
            .filter(
                Resume.id == data.resume_id
            )
            .first()
        )
   
    resume = None

    if session.resume_id:
        resume = (
            db.query(Resume)
            .filter(
                Resume.id == session.resume_id
            )
            .first()
        )
    question_text = generate_question(
        role=data.role,
        difficulty=data.difficulty,
        resume=resume
    )
   
    # Final safety fallback
    if not question_text:
        question_text = (
            "Explain the difference between REST API and GraphQL."
        )

    # Save question
    question = Question(
        session_id=session.id,
        question_text=question_text,
        question_order=1
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return InterviewStartResponse(
        session_id=session.id,
        question_id=question.id,
        question=question.question_text
    )
@router.post(
    "/answer",
    response_model=AnswerResponse
)



def answer_question(
    data: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(
        InterviewSession
    ).filter(
        InterviewSession.id == data.session_id,
        InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )

    question = db.query(
        Question
    ).filter(
        Question.id == data.question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    result = evaluate_answer(
        question=question.question_text,
        answer=data.answer,
        role=session.role
    )

    answer = Answer(
    question_id=question.id,
    answer_text=data.answer,

    score=result["score"],

    communication_score=
    result.get("communication", 0),

technical_depth_score=
    result.get("technical_depth", 0),

problem_solving_score=
    result.get("problem_solving", 0),

confidence_score=
    result.get("confidence", 0),

    feedback=result["feedback"],

    strengths=", ".join(result["strengths"]),
    improvements=", ".join(result["improvements"])
)

    db.add(answer)
    db.commit()
    db.refresh(answer)

    count = db.query(Question).filter(
    Question.session_id == session.id
).count()

# Interview finished
    if count >= MAX_QUESTIONS:
     return AnswerResponse(
        score=result.get("score", 0),

        communication=result.get(
            "communication",
            0
        ),

        technical_depth=result.get(
            "technical_depth",
            0
        ),

        problem_solving=result.get(
            "problem_solving",
            0
        ),

        confidence=result.get(
            "confidence",
            0
        ),

        feedback=result["feedback"],

        strengths=result["strengths"],
        improvements=result["improvements"],

        next_question_id=None,
        next_question=None
    )
    previous_questions = (
    db.query(Question)
    .filter(
        Question.session_id == session.id
    )
    .all()
)
    history = [
    q.question_text
    for q in previous_questions
]
   
    resume=None
    next_question_text = generate_question(
        role=session.role,
        difficulty=session.difficulty,
        resume=resume
    )

    if next_question_text is None:
            next_question_text = random.choice(
                FALLBACK_QUESTIONS
            )

    next_question = Question(
        session_id=session.id,
        question_text=next_question_text,
        question_order=count + 1
    )

    db.add(next_question)
    db.commit()
    db.refresh(next_question)

    return AnswerResponse(
    score=result["score"],

    communication=result.get(
        "communication",
        0
    ),

    technical_depth=result.get(
        "technical_depth",
        0
    ),

    problem_solving=result.get(
        "problem_solving",
        0
    ),

    confidence=result.get(
        "confidence",
        0
    ),

    feedback=result["feedback"],

    strengths=result["strengths"],
    improvements=result["improvements"],

    next_question_id=next_question.id,
    next_question=next_question.question_text
)


@router.post(
    "/end",
    response_model=InterviewEndResponse
)
def end_interview(
    data: InterviewEndRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(
        InterviewSession
    ).filter(
        InterviewSession.id == data.session_id,
        InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    answers = (
        db.query(Answer)
        .join(
            Question,
            Answer.question_id == Question.id
        )
        .filter(
            Question.session_id == session.id
        )
        .all()
    )

    scores = [
        a.score
        for a in answers
        if a.score is not None
    ]

    total_score = (
        sum(scores) / len(scores)
        if scores else 0
    )

    strengths = []
    improvements = []

    for a in answers:
        if a.strengths:
            strengths.extend(
                a.strengths.split(", ")
            )

        if a.improvements:
            improvements.extend(
                a.improvements.split(", ")
            )

    session.status = "completed"
    session.completed_at = datetime.now(UTC)
    session.total_score = round(total_score, 2)

    db.commit()

    return InterviewEndResponse(
        session_id=session.id,
        total_score=round(total_score,2),
        strengths=strengths,
        improvements=improvements
    )


@router.get(
    "/{session_id}",
    response_model=InterviewDetailResponse
)
def get_interview_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )

    questions = (
        db.query(Question)
        .filter(
            Question.session_id == session.id
        )
        .order_by(Question.question_order)
        .all()
    )

    question_details = []

    for question in questions:

        answer = (
            db.query(Answer)
            .filter(
                Answer.question_id == question.id
            )
            .first()
        )

        question_details.append(
            QuestionAnswerDetail(
                question_id=question.id,
                question=question.question_text,
                question_order=question.question_order,

                answer=(
                    answer.answer_text
                    if answer else None
                ),

                score=(
                    answer.score
                    if answer else None
                ),

                feedback=(
                    answer.feedback
                    if answer else None
                ),

                strengths=(
                    answer.strengths.split(", ")
                    if answer and answer.strengths
                    else []
                ),

                improvements=(
                    answer.improvements.split(", ")
                    if answer and answer.improvements
                    else []
                )
            )
        )

    return InterviewDetailResponse(
        session_id=session.id,
        role=session.role,
        difficulty=session.difficulty,
        status=session.status,
        score=session.total_score,
        questions=question_details
    )    
    
@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    text = extract_text_from_pdf(
        file.file
    )
    skills = extract_skills(text)

    projects = extract_projects(text)
    resume = Resume(
    user_id=current_user.id,
    filename=file.filename,
    extracted_text=text,

    skills=skills,
    projects=projects
)

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
    "resume_id": resume.id,
    "filename": resume.filename,

    "skills": skills,

    "projects": projects,

    "preview": text[:300]
}
    
