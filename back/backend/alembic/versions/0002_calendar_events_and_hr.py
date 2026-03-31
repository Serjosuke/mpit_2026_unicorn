"""calendar events and hr role

Revision ID: 0002_calendar_events_and_hr
Revises: 0001_initial
Create Date: 2026-03-31 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_calendar_events_and_hr"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        "calendar_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=True),
        sa.Column("external_request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("external_course_requests.id"), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(length=30), nullable=False, server_default="system"),
        sa.Column("sync_provider", sa.String(length=30), nullable=False, server_default="internal"),
        sa.Column("sync_status", sa.String(length=30), nullable=False, server_default="created"),
        sa.Column("external_event_id", sa.String(length=255), nullable=True),
        sa.Column("meeting_url", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_calendar_events_user_id", "calendar_events", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_calendar_events_user_id", table_name="calendar_events")
    op.drop_table("calendar_events")
