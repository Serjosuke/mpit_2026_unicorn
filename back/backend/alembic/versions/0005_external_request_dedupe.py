"""external request dedupe

Revision ID: 0005_external_request_dedupe
Revises: 0004_smart_search_course_calendar_fields
Create Date: 2026-04-01
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_external_request_dedupe"
down_revision = "0004_smart_search_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("external_course_requests", sa.Column("course_key", sa.String(length=255), nullable=True))
    op.create_index("ix_external_requests_user_course_key", "external_course_requests", ["requester_id", "course_key"], unique=False)
    op.execute("""
        UPDATE external_course_requests
        SET course_key = lower(trim(coalesce(provider_url, ''))) || '|' || lower(trim(coalesce(title, '')))
        WHERE course_key IS NULL
    """)
    op.alter_column("external_course_requests", "course_key", nullable=False)


def downgrade() -> None:
    op.drop_index("ix_external_requests_user_course_key", table_name="external_course_requests")
    op.drop_column("external_course_requests", "course_key")
