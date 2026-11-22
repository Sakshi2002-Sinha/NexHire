"""Add structured profile to resumes.

Revision ID: c7d1e4a95b20
Revises: a1f3c9e27b10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c7d1e4a95b20"
down_revision: Union[str, Sequence[str], None] = "a1f3c9e27b10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("resumes", sa.Column("profile", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("resumes", "profile")
