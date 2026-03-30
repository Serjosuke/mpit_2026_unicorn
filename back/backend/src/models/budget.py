from sqlalchemy import ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base
from src.models.mixins import UUIDMixin


class Budget(UUIDMixin, Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("department_id", "year", "quarter", name="uq_budget_scope"),)

    department_id: Mapped[str] = mapped_column(ForeignKey("departments.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[int | None] = mapped_column(Integer, nullable=True)
    limit_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    spent_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="RUB")
