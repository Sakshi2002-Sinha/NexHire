from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.dependencies import get_db
from app.limits import limit_ai_calls
from app.models import Resume, User
from app.schemas import (
    ActiveSessionResponse,
    AnswerRequest,
    AnswerResponse,
    InterviewDetailResponse,
    InterviewEndRequest,
    InterviewEndResponse,
    InterviewStartRequest,
    InterviewStartResponse,
    ResumeUploadResponse,
)
from app.services import interview_service as service
from app.services.resume_parser import extract_projects, extract_skills
from app.services.resume_profile import build_profile
from app.services.resume_services import InvalidResume, extract_text_from_pdf

router = APIRouter(prefix="/interview", tags=["Interview"])


@router.post("/start", response_model=InterviewStartResponse, status_code=status.HTTP_201_CREATED)
def start_interview(data: InterviewStartRequest, db: Session = Depends(get_db), user: User = Depends(limit_ai_calls)):
    return service.start_session(db, user, data.role, data.difficulty, data.resume_id, data.focus_node_id)


@router.post("/answer", response_model=AnswerResponse)
def answer_question(data: AnswerRequest, db: Session = Depends(get_db), user: User = Depends(limit_ai_calls)):
    return service.submit_answer(db, user, data.session_id, data.question_id, data.answer, data.speech)


@router.post("/end", response_model=InterviewEndResponse)
def end_interview(data: InterviewEndRequest, db: Session = Depends(get_db), user: User = Depends(limit_ai_calls)):
    return service.end_session(db, user, data.session_id)


# Declared before /{session_id}, otherwise "active" would be captured as an ID.
@router.get("/active", response_model=ActiveSessionResponse | None)
def active_interview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.get_active_state(db, user)


# A sync route on purpose: PDF parsing is CPU-bound and must not block the event loop.
@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(limit_ai_calls),
):
    user_id = user.id
    db.rollback()  # Release the connection: parsing and the AI call below can take seconds.
    content = file.file.read(settings.max_resume_bytes + 1)
    if len(content) > settings.max_resume_bytes:
        raise HTTPException(413, detail="Resume must be 5 MB or smaller")
    # Check the file's magic bytes: the filename and Content-Type are client-controlled.
    if not content.startswith(b"%PDF-"):
        raise HTTPException(415, detail="Please upload a PDF file")
    file.file.seek(0)
    try:
        text = extract_text_from_pdf(file.file)
    except InvalidResume as exc:
        raise HTTPException(422, detail=str(exc)) from None
    skills, projects = extract_skills(text), extract_projects(text)
    filename = (file.filename or "resume.pdf").replace("\\", "/").rsplit("/", 1)[-1][:255]
    profile = build_profile(text, skills, projects)
    resume = Resume(
        user_id=user_id, filename=filename, extracted_text=text, skills=skills, projects=projects, profile=profile
    )
    db.add(resume)
    db.commit()
    return ResumeUploadResponse(resume_id=resume.id, filename=filename, skills=skills, projects=projects)


@router.get("/{session_id}", response_model=InterviewDetailResponse)
def get_interview_session(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.session_detail(db, user, session_id)
