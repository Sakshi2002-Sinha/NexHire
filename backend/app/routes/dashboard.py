from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.dependencies import get_db

from app.models import (
    User,
    InterviewSession,
    Question,
    Answer
)

from app.schemas import (
    DashboardResponse,
    ScorePoint
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard():
    return {
        "message": "Welcome to your dashboard!"
    }


@router.get(
    "/stats",
    response_model=DashboardResponse
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id == current_user.id
        )
        .all()
    )

    role_scores = {}

    for session in sessions:

        score = getattr(
            session,
            "total_score",
            None
        )

        if score is None:
            continue

        role_scores.setdefault(
            session.role,
            []
        )

        role_scores[session.role].append(score)

    avg_score_by_role = {}

    for role, scores in role_scores.items():
        avg_score_by_role[role] = round(
            sum(scores) / len(scores),
            2
        )

    score_over_time = []

    for session in sessions:

        score = getattr(
            session,
            "total_score",
            None
        )

        if score is None:
            continue

        date = (
            session.completed_at
            or session.created_at
        )

        score_over_time.append(
            ScorePoint(
                date=date.date().isoformat(),
                score=score
            )
        )

    answers = (
        db.query(Answer)
        .join(
            Question,
            Answer.question_id == Question.id
        )
        .join(
            InterviewSession,
            Question.session_id == InterviewSession.id
        )
        .filter(
            InterviewSession.user_id == current_user.id
        )
        .all()
    )

    counter = Counter()

    for answer in answers:

        if not answer.improvements:
            continue

        items = answer.improvements.split(",")

        for item in items:

            item = item.strip().lower()

            if item:
                counter[item] += 1

    weak_topics = [
        topic
        for topic, _
        in counter.most_common(5)
    ]

    return DashboardResponse(
        avg_score_by_role=avg_score_by_role,
        score_over_time=score_over_time,
        weak_topics=weak_topics
    )