from fastapi import APIRouter, Depends
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.certificate import Certificate
from src.models.user import User
from src.schemas.certificate import CertificateCreate, CertificateOut
from src.services.audit import write_audit

router = APIRouter()


@router.get("/mine", response_model=list[CertificateOut])
def my_certificates(db: DBSession, current_user: User = Depends(get_current_user)):
    return list(db.scalars(select(Certificate).where(Certificate.user_id == current_user.id).order_by(Certificate.created_at.desc())).all())


@router.post("/", response_model=CertificateOut)
def create_certificate(payload: CertificateCreate, db: DBSession, current_user: User = Depends(get_current_user)):
    cert = Certificate(user_id=current_user.id, **payload.model_dump())
    db.add(cert)
    write_audit(db, current_user.id, "create", "certificate", cert.id, None, {"source": cert.source})
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/user/{user_id}", response_model=list[CertificateOut])
def user_certificates(user_id: str, db: DBSession, _: User = Depends(require_roles("admin", "hr", "manager"))):
    return list(db.scalars(select(Certificate).where(Certificate.user_id == user_id).order_by(Certificate.created_at.desc())).all())
