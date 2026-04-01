from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel
from src.schemas.common import ORMModel


class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str | None = None
    summary: str | None = None
    skill_tags: str | None = None
    level: str | None = None
    delivery_mode: str | None = None
    source_priority: int = 50
    is_featured_internal: bool = False
    course_type: str
    category_id: UUID | None = None
    provider_name: str | None = None
    provider_url: str | None = None
    trainer_id: UUID | None = None
    duration_hours: float | None = None
    price_amount: float | None = None
    price_currency: str | None = None
    is_mandatory: bool = False
    requires_approval: bool = False
    has_certificate: bool = True
    status: str = "draft"


class CourseOut(ORMModel):
    id: UUID
    title: str
    slug: str
    description: str | None = None
    summary: str | None = None
    skill_tags: str | None = None
    level: str | None = None
    delivery_mode: str | None = None
    source_priority: int = 50
    is_featured_internal: bool = False
    course_type: str
    status: str
    category_id: UUID | None = None
    provider_name: str | None = None
    provider_url: str | None = None
    duration_hours: float | None = None
    created_at: datetime


class SmartCourseResult(BaseModel):
    source_type: str
    title: str
    provider_name: str
    provider_url: str | None = None
    summary: str | None = None
    description: str | None = None
    level: str | None = None
    delivery_mode: str | None = None
    duration_hours: float | None = None
    price_amount: float | None = None
    price_currency: str | None = None
    freshness_label: str | None = None
    difficulty: str | None = None
    average_rating: float | None = None
    ai_rating: float | None = None
    ai_review: str | None = None
    score: float
    why_recommended: str
    course_id: UUID | None = None
    is_internal_priority: bool = False
    is_recommended: bool = False
    tags: list[str] = []


class SmartSearchOut(BaseModel):
    query: str
    normalized_query: dict
    results: list[SmartCourseResult]


class HRExternalAssignIn(BaseModel):
    employee_id: UUID
    title: str
    provider_name: str
    provider_url: str
    summary: str | None = None
    description: str | None = None
    level: str | None = None
    delivery_mode: str | None = "online"
    duration_hours: float | None = None
    due_date: date
    price_amount: float | None = None
    price_currency: str | None = "RUB"
    source_priority: int = 30


class HRBulkExternalAssignIn(BaseModel):
    user_ids: list[UUID]
    title: str
    provider_name: str
    provider_url: str
    summary: str | None = None
    description: str | None = None
    level: str | None = None
    delivery_mode: str | None = "online"
    duration_hours: float | None = None
    due_date: date
    price_amount: float | None = None
    price_currency: str | None = "RUB"
    source_priority: int = 30


class FavoriteExternalCourseIn(BaseModel):
    title: str
    provider_name: str
    provider_url: str
    summary: str | None = None
    description: str | None = None
    level: str | None = None
    delivery_mode: str | None = "online"
    duration_hours: float | None = None
    price_amount: float | None = None
    price_currency: str | None = "RUB"
    skill_tags: str | None = None


class GroupEnrollmentIn(BaseModel):
    course_id: UUID
    user_ids: list[UUID]


class HRExternalAssignOut(BaseModel):
    course: CourseOut
    enrollment_id: UUID
    calendar_event_id: UUID
    conflict_handled_as_reminder: bool
    conflict_reason: str | None = None


class HRBulkExternalAssignOut(BaseModel):
    created: int
    reminders: int
    course_ids: list[UUID] = []


class LessonTrackOut(ORMModel):
    id: UUID
    title: str
    order_index: int
    lesson_type: str
    content: str | None = None
    estimated_minutes: int | None = None
    is_completed: bool = False
    completed_at: datetime | None = None
    due_at: datetime | None = None
    deadline_status: str = "normal"


class ModuleTrackOut(ORMModel):
    id: UUID
    title: str
    description: str | None = None
    order_index: int
    lessons: list[LessonTrackOut] = []


class CourseTrackOut(ORMModel):
    course: CourseOut
    enrollment_id: UUID | None = None
    progress_percent: float = 0
    active_lessons: int = 0
    completed_lessons: int = 0
    overdue_lessons: int = 0
    modules: list[ModuleTrackOut] = []
