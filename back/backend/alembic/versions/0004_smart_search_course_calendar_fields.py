"""add smart-search course fields and calendar priority fields

Revision ID: 0004_smart_fields
Revises: 0003_user_team_fields
Create Date: 2026-03-31
"""

from alembic import op
import sqlalchemy as sa

revision = "0004_smart_search_fields"
down_revision = "0003_user_team_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("courses", sa.Column("skill_tags", sa.Text(), nullable=True))
    op.add_column("courses", sa.Column("level", sa.String(length=50), nullable=True))
    op.add_column("courses", sa.Column("delivery_mode", sa.String(length=30), nullable=True))
    op.add_column("courses", sa.Column("source_priority", sa.Integer(), nullable=False, server_default="50"))
    op.add_column("courses", sa.Column("is_featured_internal", sa.Boolean(), nullable=False, server_default=sa.text("false")))

    op.add_column("calendar_events", sa.Column("priority", sa.Integer(), nullable=False, server_default="50"))
    op.add_column("calendar_events", sa.Column("event_kind", sa.String(length=30), nullable=False, server_default="scheduled"))
    op.add_column("calendar_events", sa.Column("is_reminder_only", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("calendar_events", "is_reminder_only")
    op.drop_column("calendar_events", "event_kind")
    op.drop_column("calendar_events", "priority")

    op.drop_column("courses", "is_featured_internal")
    op.drop_column("courses", "source_priority")
    op.drop_column("courses", "delivery_mode")
    op.drop_column("courses", "level")
    op.drop_column("courses", "skill_tags")
    op.drop_column("courses", "summary")
