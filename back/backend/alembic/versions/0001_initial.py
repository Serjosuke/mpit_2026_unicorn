"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-03-30 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'departments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False, unique=True),
        sa.Column('code', sa.String(length=50), nullable=True, unique=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('middle_name', sa.String(length=100), nullable=True),
        sa.Column('role', sa.String(length=30), nullable=False),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id'), nullable=True),
        sa.Column('manager_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('trainer_bio', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('outlook_email', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table(
        'course_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False, unique=True),
        sa.Column('slug', sa.String(length=150), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
    )

    op.create_table(
        'budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('quarter', sa.Integer(), nullable=True),
        sa.Column('limit_amount', sa.Numeric(12,2), nullable=False),
        sa.Column('spent_amount', sa.Numeric(12,2), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='RUB'),
        sa.UniqueConstraint('department_id', 'year', 'quarter', name='uq_budget_scope')
    )

    op.create_table(
        'courses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('course_type', sa.String(length=20), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('course_categories.id'), nullable=True),
        sa.Column('provider_name', sa.String(length=255), nullable=True),
        sa.Column('provider_url', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('trainer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('duration_hours', sa.Numeric(6,2), nullable=True),
        sa.Column('price_amount', sa.Numeric(12,2), nullable=True),
        sa.Column('price_currency', sa.String(length=10), nullable=True),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('requires_approval', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('has_certificate', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('cover_image_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_courses_status_type', 'courses', ['status', 'course_type'])

    op.create_table(
        'course_modules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(length=30), nullable=False),
        sa.Column('content_url', sa.Text(), nullable=True),
        sa.Column('estimated_minutes', sa.Integer(), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )

    op.create_table(
        'course_lessons',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('module_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('course_modules.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('lesson_type', sa.String(length=30), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('content_url', sa.Text(), nullable=True),
        sa.Column('estimated_minutes', sa.Integer(), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )

    op.create_table(
        'course_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('timezone', sa.String(length=64), nullable=False, server_default='Europe/Moscow'),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('meeting_url', sa.Text(), nullable=True),
        sa.Column('outlook_event_id', sa.String(length=255), nullable=True),
        sa.Column('outlook_sync_status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'enrollments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='enrolled'),
        sa.Column('progress_percent', sa.Numeric(5,2), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('source', sa.String(length=30), nullable=False, server_default='self'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', 'course_id', name='uq_enrollment_user_course')
    )
    op.create_index('ix_enrollments_user_status', 'enrollments', ['user_id', 'status'])

    op.create_table(
        'external_course_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('requester_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id'), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('provider_name', sa.String(length=255), nullable=False),
        sa.Column('provider_url', sa.Text(), nullable=True),
        sa.Column('program_description', sa.Text(), nullable=True),
        sa.Column('justification', sa.Text(), nullable=False),
        sa.Column('cost_amount', sa.Numeric(12,2), nullable=False),
        sa.Column('cost_currency', sa.String(length=10), nullable=False, server_default='RUB'),
        sa.Column('requested_start_date', sa.Date(), nullable=True),
        sa.Column('requested_end_date', sa.Date(), nullable=True),
        sa.Column('estimated_duration_hours', sa.Numeric(6,2), nullable=True),
        sa.Column('budget_code', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='draft'),
        sa.Column('manager_comment', sa.Text(), nullable=True),
        sa.Column('hr_comment', sa.Text(), nullable=True),
        sa.Column('approved_course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id'), nullable=True),
        sa.Column('outlook_conflict_status', sa.String(length=30), nullable=False, server_default='unchecked'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_external_requests_user_status', 'external_course_requests', ['requester_id', 'status'])

    op.create_table(
        'approval_steps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('external_course_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('step_type', sa.String(length=30), nullable=False),
        sa.Column('approver_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('decision', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('acted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
    )

    op.create_table(
        'files',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('storage_key', sa.Text(), nullable=False, unique=True),
        sa.Column('original_name', sa.String(length=255), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'certificates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id'), nullable=True),
        sa.Column('enrollment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('enrollments.id'), nullable=True),
        sa.Column('external_request_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('external_course_requests.id'), nullable=True),
        sa.Column('certificate_number', sa.String(length=100), nullable=True),
        sa.Column('issue_date', sa.Date(), nullable=True),
        sa.Column('issuer_name', sa.String(length=255), nullable=True),
        sa.Column('file_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('files.id'), nullable=True),
        sa.Column('verification_url', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='valid'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('enrollment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rating', sa.SmallInteger(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('rating BETWEEN 1 AND 5', name='ck_reviews_rating_range'),
        sa.UniqueConstraint('user_id', 'enrollment_id', name='uq_review_user_enrollment')
    )

    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('related_entity_type', sa.String(length=50), nullable=True),
        sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_notifications_user_read', 'notifications', ['user_id', 'is_read'])

    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('actor_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_audit_logs_entity', 'audit_logs', ['entity_type', 'created_at'])

    op.create_table(
        'user_outlook_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('access_token_encrypted', sa.Text(), nullable=False),
        sa.Column('refresh_token_encrypted', sa.Text(), nullable=False),
        sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('scope', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'lesson_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('enrollment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('course_lessons.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('score', sa.Numeric(5,2), nullable=True),
        sa.UniqueConstraint('enrollment_id', 'lesson_id', name='uq_lesson_progress_enrollment_lesson')
    )


def downgrade() -> None:
    for tbl in [
        'lesson_progress','user_outlook_tokens','audit_logs','notifications','reviews',
        'certificates','files','approval_steps','external_course_requests','enrollments',
        'course_sessions','course_lessons','course_modules','courses','budgets',
        'course_categories','users','departments'
    ]:
        op.drop_table(tbl)
