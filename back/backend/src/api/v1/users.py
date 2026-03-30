from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.core.security import hash_password
from src.db.deps import DBSession
from src.models.user import User
from src.schemas.user import UserCreate, UserOut
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
