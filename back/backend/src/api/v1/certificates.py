from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.certificate import Certificate
from src.models.file_asset import FileAsset
from src.models.user import User
from src.schemas.certificate import CertificateCreate, CertificateOut
from src.services.audit import write_audit
from src.services.file_storage import save_upload

router = APIRouter()


def _serialize(cert: Certificate, db: DBSession):
    file_asset = db.get(FileAsset, cert.file_id) if cert.file_id else None
    return {
        "id": cert.id,
        "user_id": cert.user_id,
        "source": cert.source,
        "status": cert.status,
        "issue_date": cert.issue_date,
        "created_at": cert.created_at,
        "issuer_name": cert.issuer_name,
        "certificate_number": cert.certificate_number,
        "file_id": cert.file_id,
        "file_name": file_asset.original_name if file_asset else None,
        "file_url": f"/api/v1/certificates/{cert.id}/file" if file_asset else None,
    }


@router.get("/mine", response_model=list[CertificateOut])
def my_certificates(db: DBSession, current_user: User = Depends(get_current_user)):
    certs = list(db.scalars(select(Certificate).where(Certificate.user_id == current_user.id).order_by(Certificate.created_at.desc())).all())
    return [_serialize(c, db) for c in certs]


@router.post("/", response_model=CertificateOut)
def create_certificate(payload: CertificateCreate, db: DBSession, current_user: User = Depends(get_current_user)):
    cert = Certificate(user_id=current_user.id, **payload.model_dump())
    db.add(cert)
    db.flush()
    write_audit(db, current_user.id, "create", "certificate", cert.id, None, {"source": cert.source})
    db.commit()
    db.refresh(cert)
    return _serialize(cert, db)


@router.post("/upload", response_model=CertificateOut)
def upload_certificate(
    db: DBSession,
    current_user: User = Depends(get_current_user),
    source: str = Form(...),
    issuer_name: str | None = Form(default=None),
    certificate_number: str | None = Form(default=None),
    issue_date: str | None = Form(default=None),
    course_id: str | None = Form(default=None),
    enrollment_id: str | None = Form(default=None),
    file: UploadFile = File(...),
):
    allowed = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}
    if (file.content_type or '').lower() not in allowed:
        raise HTTPException(status_code=400, detail="Допустимы PDF, PNG и JPG")
    storage_key, size_bytes = save_upload(file, prefix='certificate')
    asset = FileAsset(
        owner_user_id=current_user.id,
        storage_key=storage_key,
        original_name=file.filename or Path(storage_key).name,
        mime_type=file.content_type or 'application/octet-stream',
        size_bytes=size_bytes,
        entity_type='certificate',
        entity_id=current_user.id,
    )
    db.add(asset)
    db.flush()
    cert = Certificate(
        user_id=current_user.id,
        source=source,
        issuer_name=issuer_name,
        certificate_number=certificate_number,
        issue_date=date.fromisoformat(issue_date) if issue_date else None,
        course_id=course_id,
        enrollment_id=enrollment_id,
        file_id=asset.id,
        status='valid',
    )
    db.add(cert)
    db.flush()
    write_audit(db, current_user.id, 'upload', 'certificate', cert.id, None, {'file_name': asset.original_name})
    db.commit()
    db.refresh(cert)
    return _serialize(cert, db)


@router.get("/{certificate_id}/file")
def certificate_file(certificate_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    cert = db.get(Certificate, certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail='Certificate not found')
    if current_user.role not in ['admin', 'hr', 'manager'] and cert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail='Forbidden')
    if current_user.role == 'manager':
        owner = db.get(User, cert.user_id)
        if owner and owner.manager_id != current_user.id and cert.user_id != current_user.id:
            raise HTTPException(status_code=403, detail='Forbidden')
    asset = db.get(FileAsset, cert.file_id) if cert.file_id else None
    if not asset or not Path(asset.storage_key).exists():
        raise HTTPException(status_code=404, detail='File not found')
    return FileResponse(asset.storage_key, media_type=asset.mime_type, filename=asset.original_name)


@router.get("/user/{user_id}", response_model=list[CertificateOut])
def user_certificates(user_id: str, db: DBSession, _: User = Depends(require_roles("admin", "hr", "manager"))):
    certs = list(db.scalars(select(Certificate).where(Certificate.user_id == user_id).order_by(Certificate.created_at.desc())).all())
    return [_serialize(c, db) for c in certs]
