from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel
from src.schemas.common import ORMModel


class ExternalRequestCreate(BaseModel):
    title: str
    provider_name: str
    provider_url: str | None = None
    program_description: str | None = None
    justification: str
    cost_amount: float
    cost_currency: str = "RUB"
    requested_start_date: date | None = None
    requested_end_date: date | None = None
    estimated_duration_hours: float | None = None
    budget_code: str | None = None


class ExternalRequestDecisionIn(BaseModel):
    comment: str | None = None


class ExternalRequestOut(ORMModel):
    id: UUID
    requester_id: UUID
    title: str
    provider_name: str
    status: str
    cost_amount: float
    cost_currency: str
    created_at: datetime
