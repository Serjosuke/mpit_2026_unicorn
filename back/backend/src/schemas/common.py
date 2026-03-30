from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageOut(BaseModel):
    message: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuditOut(ORMModel):
    id: UUID
    action: str
    entity_type: str
    created_at: datetime
