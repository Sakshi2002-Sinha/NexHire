"""Interview state machine: active -> completed | abandoned.

Rule: never hold a database transaction open across an AI call. A call can take
seconds, and an idle-in-transaction connection would drain the small pool.
"""
from collections import Counter
from types import SimpleNamespace

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.models import Answer, InterviewSession, Question, Resume, User, utcnow
from app.schemas import (
    ActiveSessionResponse,
    AnswerResponse,
    CompetencyScores,
    FeedbackOut,
    InterviewDetailResponse,
    InterviewEndResponse,
    InterviewStartResponse,
    QuestionAnswerDetail,
    QuestionOut,
)
from app.services import gemini_service as llm
from app.services.question_bank import fallback_question

FOLLOW_UP_BELOW = 7
HISTORY_TURNS = 3
SUMMARY_ITEMS = 5


def _not_found(what: str = "Interview session") -> HTTPException:
    # 404 rather than 403, so an attacker cannot learn that another user's ID exists.
    return HTTPException(status.HTTP_404_NOT_FOUND, detail=f"{what} not found")


def get_owned_session(db: Session, user_id: str, session_id: str) -> InterviewSession:
    session = (
        db.query(InterviewSession)
        .options(selectinload(InterviewSession.questions).selectinload(Question.answer))
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
        .populate_existing()
        .first()
    )
    if session is None:
        raise _not_found()
    return session


def _question_out(q: Question) -> QuestionOut:
    return QuestionOut(id=q.id, text=q.question_text, number=q.question_order, is_followup=bool(q.is_followup))


def _feedback_out(a: Answer) -> FeedbackOut:
    return FeedbackOut(
        score=a.score or 0,
        communication=a.communication_score or 0,
        technical_depth=a.technical_depth_score or 0,
        problem_solving=a.problem_solving_score or 0,
        confidence=a.confidence_score or 0,
        feedback=a.feedback or "",
        strengths=a.strengths or [],
        improvements=a.improvements or [],
    )


def _competencies(s: InterviewSession) -> CompetencyScores:
    return CompetencyScores(
        communication=s.communication_avg,
        technical_depth=s.technical_depth_avg,
        problem_solving=s.problem_solving_avg,
        confidence=s.confidence_avg,
    )


def _resume_snapshot(resume: Resume | None):
    """Plain copy, safe to read after the DB session has released its connection."""
    if resume is None:
        return None
    return SimpleNamespace(skills=list(resume.skills or []), projects=list(resume.projects or []))


def _safe_question(role, difficulty, asked, recent=None, follow_up=False, resume=None) -> tuple[str, bool]:
    """A failed question is recoverable: serve a curated one so the interview continues."""
    try:
        return llm.generate_question(role, difficulty, asked, recent, follow_up, resume), follow_up
    except llm.LLMUnavailable:
        return fallback_question(role, asked), False


def start_session(db: Session, user: User, role: str, difficulty: str, resume_id: str | None):
    user_id = user.id
    conflict = HTTPException(status.HTTP_409_CONFLICT, detail="You already have an interview in progress")
    if db.query(InterviewSession.id).filter_by(user_id=user_id, status="active").first():
        raise conflict

    resume = None
    if resume_id:
        row = db.query(Resume).filter_by(id=resume_id, user_id=user_id).first()
        if row is None:
            raise _not_found("Resume")
        resume = _resume_snapshot(row)
    db.rollback()  # Release the connection before the AI call.

    text, _ = _safe_question(role, difficulty, [], resume=resume)
    # Session and first question commit together, so no session exists without a question.
    session = InterviewSession(user_id=user_id, role=role, difficulty=difficulty, resume_id=resume_id, status="active")
    question = Question(session=session, question_text=text, question_order=1)
    db.add(session)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise conflict from None
    return InterviewStartResponse(
        session_id=session.id,
        max_questions=settings.max_questions,
        question=_question_out(question),
    )


def _ensure_next_question(db: Session, session_id: str, user_id: str, order: int) -> Question | None:
    """Return the question after `order`, creating it if needed (also repairs a crash mid-request)."""
    if order >= settings.max_questions:
        return None
    session = get_owned_session(db, user_id, session_id)
    existing = next((q for q in session.questions if q.question_order == order + 1), None)
    if existing:
        return existing

    recent = [
        {"question": q.question_text, "answer": q.answer.answer_text, "score": q.answer.score or 0}
        for q in [q for q in session.questions if q.answer][-HISTORY_TURNS:]
    ]
    latest = next(q for q in session.questions if q.question_order == order)
    # At most one follow-up in a row, so a weak answer does not trap the candidate on one topic.
    follow_up = (latest.answer.score or 0) < FOLLOW_UP_BELOW and not latest.is_followup
    role, difficulty = session.role, session.difficulty
    asked = [q.question_text for q in session.questions]
    resume = _resume_snapshot(session.resume)
    db.rollback()

    text, is_followup = _safe_question(role, difficulty, asked, recent, follow_up, resume)
    question = Question(session_id=session_id, question_text=text, question_order=order + 1, is_followup=is_followup)
    db.add(question)
    try:
        db.commit()
    except IntegrityError:
        # A concurrent request created it first; both callers return that same question.
        db.rollback()
        return db.query(Question).filter_by(session_id=session_id, question_order=order + 1).one()
    return question


def submit_answer(db: Session, user: User, session_id: str, question_id: str, answer_text: str) -> AnswerResponse:
    user_id = user.id
    session = get_owned_session(db, user_id, session_id)
    if session.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, detail="This interview has already ended")
    # Looked up inside the owned session, so another user's question ID cannot be answered.
    question = next((q for q in session.questions if q.id == question_id), None)
    if question is None:
        raise _not_found("Question")

    if question.answer is None:
        prompt, role, difficulty = question.question_text, session.role, session.difficulty
        db.rollback()
        try:
            result = llm.evaluate_answer(prompt, answer_text, role, difficulty)
        except llm.LLMUnavailable:
            # Nothing is saved, so the same answer can be retried and no fake score enters analytics.
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI evaluation is temporarily unavailable. Your answer was kept, please retry.",
                headers={"Retry-After": "30"},
            ) from None
        db.add(
            Answer(
                question_id=question_id,
                answer_text=answer_text,
                score=result["score"],
                communication_score=result["communication"],
                technical_depth_score=result["technical_depth"],
                problem_solving_score=result["problem_solving"],
                confidence_score=result["confidence"],
                feedback=result["feedback"],
                strengths=result["strengths"],
                improvements=result["improvements"],
                weak_topics=result["weak_topics"],
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()  # A concurrent submit won; fall through and return its result.

    session = get_owned_session(db, user_id, session_id)
    question = next(q for q in session.questions if q.id == question_id)
    feedback = _feedback_out(question.answer)
    next_question = _ensure_next_question(db, session_id, user_id, question.question_order)
    return AnswerResponse(feedback=feedback, next_question=_question_out(next_question) if next_question else None)


def get_active_state(db: Session, user: User) -> ActiveSessionResponse | None:
    """Rebuild the live interview from the database. This is what makes refresh safe."""
    user_id = user.id
    row = (
        db.query(InterviewSession.id)
        .filter_by(user_id=user_id, status="active")
        .order_by(InterviewSession.created_at.desc())
        .first()
    )
    if row is None:
        return None
    session_id = row.id
    session = get_owned_session(db, user_id, session_id)
    if not session.questions:
        return None

    if all(q.answer for q in session.questions):
        # Crash between saving an answer and creating the next question: repair it.
        if _ensure_next_question(db, session_id, user_id, session.questions[-1].question_order):
            session = get_owned_session(db, user_id, session_id)

    unanswered = next((q for q in session.questions if q.answer is None), None)
    answered = [q for q in session.questions if q.answer]
    if unanswered is None:
        current, current_fb, previous_fb = session.questions[-1], _feedback_out(answered[-1].answer), None
    else:
        current, current_fb = unanswered, None
        previous_fb = _feedback_out(answered[-1].answer) if answered else None

    return ActiveSessionResponse(
        session_id=session.id,
        role=session.role,
        difficulty=session.difficulty,
        max_questions=settings.max_questions,
        current_question=_question_out(current),
        current_feedback=current_fb,
        previous_feedback=previous_fb,
    )


def _top_items(lists) -> list[str]:
    counts = Counter()
    display: dict[str, str] = {}
    for items in lists:
        for item in items or []:
            key = item.strip().lower()
            if key:
                counts[key] += 1
                display.setdefault(key, item.strip())
    return [display[key] for key, _ in counts.most_common(SUMMARY_ITEMS)]


def _mean(values) -> float | None:
    present = [v for v in values if v is not None]
    return round(sum(present) / len(present), 2) if present else None


def _end_response(session: InterviewSession) -> InterviewEndResponse:
    answers = [q.answer for q in session.questions if q.answer]
    return InterviewEndResponse(
        session_id=session.id,
        status=session.status,
        total_score=session.total_score,
        competencies=_competencies(session),
        summary=session.summary,
        strengths=_top_items(a.strengths for a in answers),
        improvements=_top_items(a.improvements for a in answers),
    )


def end_session(db: Session, user: User, session_id: str) -> InterviewEndResponse:
    user_id = user.id
    session = get_owned_session(db, user_id, session_id)
    if session.status != "active":
        return _end_response(session)  # Idempotent: a retry never recomputes.

    pairs = [
        {"question": q.question_text, "answer": q.answer.answer_text, "score": q.answer.score or 0}
        for q in session.questions
        if q.answer
    ]
    summary = None
    if pairs:
        role = session.role
        db.rollback()
        try:
            summary = llm.generate_session_summary(role, pairs)
        except llm.LLMUnavailable:
            average = sum(p["score"] for p in pairs) / len(pairs)
            summary = f"You answered {len(pairs)} question(s) with an average score of {average:.1f}/10."
        session = get_owned_session(db, user_id, session_id)
        if session.status != "active":
            return _end_response(session)

    answers = [q.answer for q in session.questions if q.answer]
    session.status = "completed" if answers else "abandoned"  # No answers: exclude from analytics.
    session.completed_at = utcnow()
    session.summary = summary
    session.total_score = _mean(a.score for a in answers)
    session.communication_avg = _mean(a.communication_score for a in answers)
    session.technical_depth_avg = _mean(a.technical_depth_score for a in answers)
    session.problem_solving_avg = _mean(a.problem_solving_score for a in answers)
    session.confidence_avg = _mean(a.confidence_score for a in answers)
    db.commit()
    return _end_response(session)


def session_detail(db: Session, user: User, session_id: str) -> InterviewDetailResponse:
    session = get_owned_session(db, user.id, session_id)
    questions = []
    for q in session.questions:
        a = q.answer
        questions.append(
            QuestionAnswerDetail(
                question_id=q.id,
                question=q.question_text,
                question_order=q.question_order,
                is_followup=bool(q.is_followup),
                answer=a.answer_text if a else None,
                score=a.score if a else None,
                communication=a.communication_score if a else None,
                technical_depth=a.technical_depth_score if a else None,
                problem_solving=a.problem_solving_score if a else None,
                confidence=a.confidence_score if a else None,
                feedback=a.feedback if a else None,
                strengths=(a.strengths or []) if a else [],
                improvements=(a.improvements or []) if a else [],
            )
        )
    return InterviewDetailResponse(
        session_id=session.id,
        role=session.role,
        difficulty=session.difficulty,
        status=session.status,
        score=session.total_score,
        competencies=_competencies(session),
        summary=session.summary,
        created_at=session.created_at,
        questions=questions,
    )


def answered_counts(db: Session, session_ids: list[str]) -> dict[str, int]:
    """One grouped query instead of one count per session (avoids N+1)."""
    if not session_ids:
        return {}
    rows = (
        db.query(Question.session_id, func.count(Answer.id))
        .join(Answer, Answer.question_id == Question.id)
        .filter(Question.session_id.in_(session_ids))
        .group_by(Question.session_id)
        .all()
    )
    return {session_id: count for session_id, count in rows}
