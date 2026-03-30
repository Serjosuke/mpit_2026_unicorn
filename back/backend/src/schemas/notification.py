from datetime import datetime
from uuid import UUID
from src.schemas.common import ORMModel


class NotificationOut(ORMModel):
    id: UUID
    type: str
    title: str
    body: str
    is_read: bool
    created_at: datetime
