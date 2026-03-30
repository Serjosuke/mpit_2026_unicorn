from sqlalchemy import Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base
from src.models.mixins import TimestampMixin, UUIDMixin


class ExternalCourseRequest(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "external_course_requests"
    __table_args__ = (Index("ix_external_requests_user_status", "requester_id", "status"),)

    requester_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    program_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    cost_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    cost_currency: Mapped[str] = mapped_column(String(10), nullable=False, default="RUB")
    requested_start_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    requested_end_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    estimated_duration_hours: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    budget_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft")
    manager_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    hr_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_course_id: Mapped[str | None] = mapped_column(ForeignKey("courses.id"), nullable=True)
    outlook_conflict_status: Mapped[str] = mapped_column(String(30), default="unchecked")
