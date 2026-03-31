from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base
from src.models.mixins import UUIDMixin


class LessonProgress(UUIDMixin, Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("enrollment_id", "lesson_id", name="uq_lesson_progress_enrollment_lesson"),)

    enrollment_id: Mapped[str] = mapped_column(ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False)
    lesson_id: Mapped[str] = mapped_column(ForeignKey("course_lessons.id", ondelete="CASCADE"), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
