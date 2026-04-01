from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.core.security import hash_password
from src.db.deps import DBSession
from src.models.certificate import Certificate
from src.models.course import Course
from src.models.department import Department
from src.models.enrollment import Enrollment
from src.models.user import User
from src.schemas.user import UserCreate, UserOut, UserUpdate
from src.services.audit import write_audit

router = APIRouter()


@router.get("/", response_model=list[UserOut])
def list_users(db: DBSession, _: User = Depends(require_roles("admin", "hr", "manager"))):
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


@router.post("/", response_model=UserOut)
def create_user(payload: UserCreate, db: DBSession, current_user: User = Depends(require_roles("admin", "hr"))):
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        middle_name=payload.middle_name,
        role=payload.role,
        department_id=payload.department_id,
        manager_id=payload.manager_id,
        is_active=True,
        is_verified=True,
        position_title=payload.position_title,
        team_name=payload.team_name,
    )
    db.add(user)
    write_audit(db, current_user.id, "create", "user", user.id, None, {"email": user.email, "role": user.role})
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role not in ["admin", "hr", "manager"] and current_user.id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


@router.get("/{user_id}/profile-summary")
def get_user_profile_summary(user_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role == "manager" and user.manager_id != current_user.id and current_user.id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if current_user.role not in ["admin", "hr", "manager"] and current_user.id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    dep = db.get(Department, user.department_id) if user.department_id else None
    enrollments = list(db.scalars(select(Enrollment).where(Enrollment.user_id == user.id).order_by(Enrollment.updated_at.desc())).all())
    certificates = list(db.scalars(select(Certificate).where(Certificate.user_id == user.id).order_by(Certificate.created_at.desc())).all())
    active_courses = []
    for e in enrollments[:6]:
        c = db.get(Course, e.course_id)
        active_courses.append({
            "enrollment_id": str(e.id),
            "course_id": str(e.course_id),
            "course_title": c.title if c else "—",
            "status": e.status,
            "progress_percent": float(e.progress_percent),
            "updated_at": e.updated_at.isoformat() if e.updated_at else None,
        })
    return {
        "user": {
            "id": str(user.id),
            "full_name": " ".join(x for x in [user.last_name, user.first_name, user.middle_name] if x),
            "email": user.email,
            "role": user.role,
            "department_name": dep.name if dep else None,
            "team_name": user.team_name,
            "position_title": user.position_title,
        },
        "stats": {
            "active_courses": len([e for e in enrollments if e.status in ["enrolled", "in_progress"]]),
            "completed_courses": len([e for e in enrollments if e.status == "completed"]),
            "certificates": len(certificates),
            "last_activity_at": (enrollments[0].updated_at if enrollments else user.created_at).isoformat() if (enrollments or user.created_at) else None,
        },
        "courses": active_courses,
        "certificates": [
            {
                "id": str(c.id),
                "issuer_name": c.issuer_name,
                "issue_date": c.issue_date.isoformat() if c.issue_date else None,
                "status": c.status,
                "source": c.source,
                "file_id": str(c.file_id) if c.file_id else None,
            }
            for c in certificates[:8]
        ],
    }


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, db: DBSession, current_user: User = Depends(require_roles("admin", "hr"))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    before = {"department_id": user.department_id, "manager_id": user.manager_id, "team_name": user.team_name, "position_title": user.position_title, "role": user.role}
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    write_audit(db, current_user.id, "update", "user", user.id, before, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(user)
    return user
