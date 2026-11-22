"""Harden schema: cascades, indexes, one-answer rule, JSON feedback, session analytics.

Revision ID: a1f3c9e27b10
Revises: f85af3882320
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1f3c9e27b10"
down_revision: Union[str, Sequence[str], None] = "f85af3882320"
branch_labels = None
depends_on = None

_FKS = [
    ("interview_sessions", "interview_sessions_user_id_fkey", "users", "user_id", "CASCADE"),
    ("interview_sessions", "interview_sessions_resume_id_fkey", "resumes", "resume_id", "SET NULL"),
    ("questions", "questions_session_id_fkey", "interview_sessions", "session_id", "CASCADE"),
    ("answers", "answers_question_id_fkey", "questions", "question_id", "CASCADE"),
]
_AVGS = ["communication_avg", "technical_depth_avg", "problem_solving_avg", "confidence_avg"]


def upgrade() -> None:
    for name in _AVGS:
        op.add_column("interview_sessions", sa.Column(name, sa.Float(), nullable=True))
    op.add_column("interview_sessions", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("questions", sa.Column("is_followup", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("answers", sa.Column("weak_topics", postgresql.JSONB(), nullable=True))

    # Old comma-joined text cannot be split reliably, so each value is kept whole as one item.
    for column in ("strengths", "improvements"):
        op.execute(f"""
            ALTER TABLE answers ALTER COLUMN {column} TYPE JSONB USING
            CASE WHEN {column} IS NULL OR {column} = '' THEN '[]'::jsonb
                 ELSE jsonb_build_array({column}) END
        """)

    # Required before the unique rule: keep each question's earliest answer.
    op.execute("""
        DELETE FROM answers a USING answers b
        WHERE a.question_id = b.question_id
          AND (a.created_at, a.id) > (b.created_at, b.id)
    """)
    op.create_unique_constraint("uq_answers_question_id", "answers", ["question_id"])

    # Keep each user's newest active session; older ones were unreachable in the old UI.
    op.execute("""
        UPDATE interview_sessions s SET status = 'abandoned'
        WHERE s.status = 'active' AND EXISTS (
            SELECT 1 FROM interview_sessions n
            WHERE n.user_id = s.user_id AND n.status = 'active'
              AND (n.created_at, n.id) > (s.created_at, s.id)
        )
    """)
    op.execute("UPDATE interview_sessions SET status = 'abandoned' WHERE status IS NULL")
    op.create_index(
        "uq_one_active_session_per_user",
        "interview_sessions",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )
    op.create_index("ix_sessions_user_created", "interview_sessions", ["user_id", "created_at"])
    # Renumber rather than delete, so any duplicate question from the old race keeps its answer.
    op.execute("""
        UPDATE questions q SET question_order = r.rn
        FROM (
            SELECT id, row_number() OVER (
                PARTITION BY session_id ORDER BY question_order, created_at, id
            ) AS rn
            FROM questions
        ) r
        WHERE q.id = r.id AND q.question_order <> r.rn
    """)
    op.create_unique_constraint("uq_questions_session_order", "questions", ["session_id", "question_order"])
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])

    for table, name, target, column, action in _FKS:
        op.execute(f'ALTER TABLE {table} DROP CONSTRAINT IF EXISTS "{name}"')
        op.create_foreign_key(name, table, target, [column], ["id"], ondelete=action)


def downgrade() -> None:
    for table, name, target, column, _ in _FKS:
        op.drop_constraint(name, table, type_="foreignkey")
        op.create_foreign_key(name, table, target, [column], ["id"])
    op.drop_index("ix_resumes_user_id", table_name="resumes")
    op.drop_constraint("uq_questions_session_order", "questions", type_="unique")
    op.drop_index("ix_sessions_user_created", table_name="interview_sessions")
    op.drop_index("uq_one_active_session_per_user", table_name="interview_sessions")
    op.drop_constraint("uq_answers_question_id", "answers", type_="unique")
    for column in ("strengths", "improvements"):
        op.execute(f"ALTER TABLE answers ADD COLUMN {column}_text TEXT")
        op.execute(f"""
            UPDATE answers SET {column}_text =
            (SELECT string_agg(item, ', ') FROM jsonb_array_elements_text({column}) AS item)
        """)
        op.drop_column("answers", column)
        op.alter_column("answers", f"{column}_text", new_column_name=column)
    op.drop_column("answers", "weak_topics")
    op.drop_column("questions", "is_followup")
    op.drop_column("interview_sessions", "summary")
    for name in _AVGS:
        op.drop_column("interview_sessions", name)
