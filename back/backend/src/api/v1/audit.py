from fastapi import APIRouter, Depends
from sqlalchemy import select

from src.api.deps import require_roles
from src.db.deps import DBSession
from src.models.audit_log import AuditLog
from src.models.user import User
from src.schemas.common import AuditOut

router = APIRouter()


@router.get("/", response_model=list[AuditOut])
def list_audit(db: DBSession, _: User = Depends(require_roles("admin", "hr"))):
    return list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)).all())
