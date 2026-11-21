from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.dependencies import get_db
from app.models import InterviewSession, User
from app.schemas import HistoryResponse, InterviewDetailResponse, SessionSummary
from app.services import interview_service as service

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryResponse)
def get_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    base = db.query(InterviewSession).filter(InterviewSession.user_id == user.id)
    total = base.count()
    sessions = base.order_by(InterviewSession.created_at.desc()).offset(offset).limit(limit).all()
    counts = service.answered_counts(db, [s.id for s in sessions])
    return HistoryResponse(
        total=total,
        sessions=[
            SessionSummary(
                session_id=s.id,
                role=s.role,
                difficulty=s.difficulty,
                status=s.status,
                score=s.total_score,
                questions_answered=counts.get(s.id, 0),
                created_at=s.created_at,
            )
            for s in sessions
        ],
    )


@router.get("/{session_id}", response_model=InterviewDetailResponse)
def get_session_detail(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.session_detail(db, user, session_id)
