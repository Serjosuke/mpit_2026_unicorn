from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr

from src.schemas.common import ORMModel


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    middle_name: str | None = None
    role: str = "employee"
    department_id: UUID | None = None
    manager_id: UUID | None = None
    position_title: str | None = None
    team_name: str | None = None


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    role: str | None = None
    department_id: UUID | None = None
    manager_id: UUID | None = None
    position_title: str | None = None
    team_name: str | None = None
    is_active: bool | None = None


class UserOut(ORMModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    middle_name: str | None = None
    role: str
    department_id: UUID | None = None
    manager_id: UUID | None = None
    position_title: str | None = None
    team_name: str | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime
