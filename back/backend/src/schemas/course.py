from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from src.schemas.common import ORMModel


class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str | None = None
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
    course_type: str
    status: str
    category_id: UUID | None = None
    created_at: datetime
