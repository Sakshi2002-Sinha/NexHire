from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.dependencies import get_db
from app.limits import limit_ai_calls
from app.models import InterviewSession, Resume, User
from app.schemas import ResumeListItem, ResumeListResponse, ResumeTreeResponse
from app.services.resume_profile import apply_mastery, build_profile, build_tree, resume_profile, tree_stats

router = APIRouter(prefix="/resumes", tags=["Resume"])


def _owned_resume(db: Session, user_id: str, resume_id: str) -> Resume:
    resume = db.query(Resume).filter_by(id=resume_id, user_id=user_id).first()
    if resume is None:
        raise HTTPException(404, detail="Resume not found")
    return resume


def _mastery(db: Session, resume: Resume) -> dict[tuple[str, str], float]:
    rows = (
        db.query(InterviewSession.focus, InterviewSession.total_score)
        .filter(
            InterviewSession.user_id == resume.user_id,
            InterviewSession.resume_id == resume.id,
            InterviewSession.status == "completed",
            InterviewSession.focus.isnot(None),
            InterviewSession.total_score.isnot(None),
        )
        .order_by(InterviewSession.completed_at)
        .all()
    )
    # Ordered oldest to newest, so the latest attempt wins and a node can improve.
    return {(focus["node_id"], focus["label"]): score for focus, score in rows if focus}


def _tree_response(db: Session, resume: Resume, owner_name: str) -> ResumeTreeResponse:
    profile = resume_profile(resume)
    return ResumeTreeResponse(
        resume_id=resume.id,
        filename=resume.filename,
        uploaded_at=resume.uploaded_at,
        source=profile["source"],
        stats=tree_stats(profile),
        tree=apply_mastery(build_tree(profile, owner_name), _mastery(db, resume)),
    )


@router.get("", response_model=ResumeListResponse)
def list_resumes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Resume).filter_by(user_id=user.id).order_by(Resume.uploaded_at.desc()).limit(20).all()
    return ResumeListResponse(
        resumes=[ResumeListItem(resume_id=r.id, filename=r.filename, uploaded_at=r.uploaded_at) for r in rows]
    )


@router.get("/{resume_id}/tree", response_model=ResumeTreeResponse)
def get_resume_tree(resume_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _tree_response(db, _owned_resume(db, user.id, resume_id), user.name)


@router.post("/{resume_id}/analyze", response_model=ResumeTreeResponse)
def analyze_resume(resume_id: str, db: Session = Depends(get_db), user: User = Depends(limit_ai_calls)):
    """Retry AI extraction for a resume that only has the basic tree."""
    user_id, owner_name = user.id, user.name
    resume = _owned_resume(db, user_id, resume_id)
    text, skills, projects = resume.extracted_text or "", resume.skills or [], resume.projects or []
    if not text:
        raise HTTPException(422, detail="This resume has no readable text")
    db.rollback()  # Release the connection before the AI call.

    profile = build_profile(text, skills, projects)
    resume = _owned_resume(db, user_id, resume_id)
    resume.profile = profile
    db.commit()
    return _tree_response(db, resume, owner_name)
