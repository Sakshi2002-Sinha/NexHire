"""Add Resume Defense focus and speech metrics.

Revision ID: d4e8b2f61a37
Revises: c7d1e4a95b20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d4e8b2f61a37"
down_revision: Union[str, Sequence[str], None] = "c7d1e4a95b20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("interview_sessions", sa.Column("focus", postgresql.JSONB(), nullable=True))
    op.add_column("answers", sa.Column("speech", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("answers", "speech")
    op.drop_column("interview_sessions", "focus")
