from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base
from src.models.mixins import TimestampMixin, UUIDMixin


class Enrollment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "enrollments"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    course_id: Mapped[str] = mapped_column(ForeignKey("courses.id"), nullable=False, index=True)

    status: Mapped[str] = mapped_column(String(30), nullable=False, default="in_progress")
    progress_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    target_completion_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user = relationship("User")
    course = relationship("Course")
