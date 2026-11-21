from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.dependencies import get_db
from app.models import Answer, InterviewSession, Question, User
from app.schemas import CompetencyScores, DashboardResponse, ScorePoint

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

TREND_POINTS = 30
TOPIC_ANSWERS = 200


def _round(value) -> float | None:
    return round(float(value), 2) if value is not None else None


@router.get("/stats", response_model=DashboardResponse)
def get_dashboard_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scored = (
        InterviewSession.user_id == user.id,
        InterviewSession.status == "completed",
        InterviewSession.total_score.isnot(None),
    )
    total, average, best = (
        db.query(
            func.count(InterviewSession.id),
            func.avg(InterviewSession.total_score),
            func.max(InterviewSession.total_score),
        )
        .filter(*scored)
        .one()
    )
    by_role = (
        db.query(InterviewSession.role, func.avg(InterviewSession.total_score))
        .filter(*scored)
        .group_by(InterviewSession.role)
        .all()
    )
    recent = (
        db.query(InterviewSession)
        .filter(*scored)
        .order_by(func.coalesce(InterviewSession.completed_at, InterviewSession.created_at).desc())
        .limit(TREND_POINTS)
        .all()
    )
    # Averaged from answers so sessions finished before the summary columns existed still count.
    answer_scope = (
        db.query(Answer)
        .join(Question, Answer.question_id == Question.id)
        .join(InterviewSession, Question.session_id == InterviewSession.id)
        .filter(*scored)
    )
    comm, tech, prob, conf = answer_scope.with_entities(
        func.avg(Answer.communication_score),
        func.avg(Answer.technical_depth_score),
        func.avg(Answer.problem_solving_score),
        func.avg(Answer.confidence_score),
    ).one()
    topic_rows = (
        answer_scope.order_by(Answer.created_at.desc()).limit(TOPIC_ANSWERS).with_entities(Answer.weak_topics).all()
    )
    topics = Counter(topic for (row,) in topic_rows for topic in (row or []))

    return DashboardResponse(
        total_interviews=total,
        average_score=_round(average),
        best_score=_round(best),
        avg_score_by_role={role: _round(score) for role, score in by_role},
        score_over_time=[
            ScorePoint(date=s.completed_at or s.created_at, score=s.total_score, role=s.role) for s in reversed(recent)
        ],
        competencies=CompetencyScores(
            communication=_round(comm),
            technical_depth=_round(tech),
            problem_solving=_round(prob),
            confidence=_round(conf),
        ),
        weak_topics=[topic for topic, _ in topics.most_common(6)],
    )
