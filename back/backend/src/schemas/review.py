from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from src.schemas.common import ORMModel


class ReviewCreate(BaseModel):
    course_id: UUID
    enrollment_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewOut(ORMModel):
    id: UUID
    course_id: UUID
    enrollment_id: UUID
    rating: int
    comment: str | None = None
    created_at: datetime
