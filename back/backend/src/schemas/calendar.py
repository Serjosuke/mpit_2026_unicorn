from datetime import datetime
from uuid import UUID

from src.schemas.common import ORMModel


class CalendarEventOut(ORMModel):
    id: UUID
    user_id: UUID
    title: str
    description: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    source: str
    sync_provider: str
    sync_status: str
    course_id: UUID | None = None
    external_request_id: UUID | None = None
    meeting_url: str | None = None
    external_event_id: str | None = None
    location: str | None = None
    created_at: datetime
    updated_at: datetime
