"""add enrollment target completion date

Revision ID: 0006_enrollment_targets
Revises: 0005_external_request_dedupe
Create Date: 2026-04-01
"""

from alembic import op
import sqlalchemy as sa


revision = '0006_enrollment_targets'
down_revision = '0005_external_request_dedupe'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('enrollments', sa.Column('target_completion_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('enrollments', 'target_completion_date')
