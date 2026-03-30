from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone

from src.db.base import Base
from src.models.mixins import UUIDMixin


class ApprovalStep(UUIDMixin, Base):
    __tablename__ = "approval_steps"

    request_id: Mapped[str] = mapped_column(ForeignKey("external_course_requests.id", ondelete="CASCADE"), nullable=False)
    step_type: Mapped[str] = mapped_column(String(30), nullable=False)
    approver_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    decision: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    acted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
