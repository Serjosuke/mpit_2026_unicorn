from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from src.schemas.common import ORMModel


class EnrollmentCreate(BaseModel):
    course_id: UUID


class EnrollmentOut(ORMModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    status: str
    progress_percent: float
    source: str
    created_at: datetime
