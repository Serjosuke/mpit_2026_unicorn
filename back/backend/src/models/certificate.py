from datetime import date, datetime, timezone
from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base
from src.models.mixins import UUIDMixin


class Certificate(UUIDMixin, Base):
    __tablename__ = "certificates"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[str | None] = mapped_column(ForeignKey("courses.id"), nullable=True)
    enrollment_id: Mapped[str | None] = mapped_column(ForeignKey("enrollments.id"), nullable=True)
    external_request_id: Mapped[str | None] = mapped_column(ForeignKey("external_course_requests.id"), nullable=True)
    certificate_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    issuer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_id: Mapped[str | None] = mapped_column(ForeignKey("files.id"), nullable=True)
    verification_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="valid")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
