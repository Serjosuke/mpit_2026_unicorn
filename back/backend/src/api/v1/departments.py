from fastapi import APIRouter, Depends
from sqlalchemy import select

from src.api.deps import require_roles
from src.db.deps import DBSession
from src.models.department import Department
from src.models.user import User
from src.schemas.department import DepartmentCreate, DepartmentOut
from src.services.audit import write_audit

router = APIRouter()


@router.get("/", response_model=list[DepartmentOut])
def list_departments(db: DBSession, _: User = Depends(require_roles("admin", "hr", "manager", "employee"))):
    return list(db.scalars(select(Department).order_by(Department.name)).all())


@router.post("/", response_model=DepartmentOut)
def create_department(payload: DepartmentCreate, db: DBSession, current_user: User = Depends(require_roles("admin", "hr"))):
    dep = Department(name=payload.name, code=payload.code, parent_id=payload.parent_id)
    db.add(dep)
    write_audit(db, current_user.id, "create", "department", dep.id, None, {"name": dep.name})
    db.commit()
    db.refresh(dep)
    return dep
