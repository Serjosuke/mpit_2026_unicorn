from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel
from src.schemas.common import ORMModel


class CertificateCreate(BaseModel):
    course_id: UUID | None = None
    enrollment_id: UUID | None = None
    external_request_id: UUID | None = None
    certificate_number: str | None = None
    issue_date: date | None = None
    issuer_name: str | None = None
    file_id: UUID | None = None
    verification_url: str | None = None
    source: str


class CertificateOut(ORMModel):
    id: UUID
    user_id: UUID
    source: str
    status: str
    issue_date: date | None = None
    created_at: datetime
