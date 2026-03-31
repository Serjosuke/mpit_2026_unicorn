from sqlalchemy import Boolean, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base
from src.models.mixins import TimestampMixin, UUIDMixin


class Course(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "courses"
    __table_args__ = (Index("ix_courses_status_type", "status", "course_type"),)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    skill_tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    delivery_mode: Mapped[str | None] = mapped_column(String(30), nullable=True)
    source_priority: Mapped[int] = mapped_column(default=50)
    is_featured_internal: Mapped[bool] = mapped_column(Boolean, default=False)
    course_type: Mapped[str] = mapped_column(String(20), nullable=False)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("course_categories.id"), nullable=True)
    provider_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    trainer_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    duration_hours: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    price_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    has_certificate: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    cover_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    modules = relationship("CourseModule", back_populates="course", cascade="all, delete-orphan")
