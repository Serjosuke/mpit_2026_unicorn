from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from src.schemas.common import ORMModel


class EnrollmentCreate(BaseModel):
    course_id: UUID


class EnrollmentProgressUpdate(BaseModel):
    progress_percent: float


class EnrollmentOut(ORMModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    status: str
    progress_percent: float
    source: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    target_completion_date: date | None = None
