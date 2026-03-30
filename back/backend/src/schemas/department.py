from uuid import UUID
from pydantic import BaseModel
from src.schemas.common import ORMModel


class DepartmentCreate(BaseModel):
    name: str
    code: str | None = None
    parent_id: UUID | None = None


class DepartmentOut(ORMModel):
    id: UUID
    name: str
    code: str | None = None
    parent_id: UUID | None = None
