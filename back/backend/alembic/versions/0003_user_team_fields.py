"""user team fields

Revision ID: 0003_user_team_fields
Revises: 0002_calendar_events_and_hr
Create Date: 2026-03-31
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_user_team_fields"
down_revision = "0002_calendar_events_and_hr"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("position_title", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("team_name", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "team_name")
    op.drop_column("users", "position_title")
