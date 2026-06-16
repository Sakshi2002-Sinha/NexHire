
from fastapi import APIRouter, Depends,HTTPException

from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.dependencies import get_db
from app.models import InterviewSession, User
from app.schemas import HistoryResponse
from app.schemas import SessionSummary
from datetime import UTC, datetime


router=APIRouter(
    prefix="/history",
    tags=["History"])

@router.get("/", response_model=HistoryResponse)
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id == current_user.id
        )
        .order_by(
            InterviewSession.created_at.desc()
        )
        .all()
    )
    
    session_list = []

    for session in sessions:
        session_list.append(
            SessionSummary(
                session_id=session.id,
                role=session.role,
                difficulty=session.difficulty,
                status=session.status,
                score=getattr(session, "total_score", None),
                created_at=session.created_at
            )
        )

    return HistoryResponse(
        sessions=session_list
    )

@router.get("/{session_id}",response_model=SessionSummary)
def get_session_summary(
    session_id:str,
    db:Session=Depends(get_db), 
    current_user:User=Depends(get_current_user)
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
            detail="Session not found"
        )
    return SessionSummary(
        session_id=session.id,
        role=session.role,
        difficulty=session.difficulty,
        status=session.status,
        score=getattr(session, "total_score", None),
        created_at=session.created_at
    )