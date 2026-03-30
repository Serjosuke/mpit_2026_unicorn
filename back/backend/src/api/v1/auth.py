from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from src.api.deps import get_current_user
from src.core.enums import UserRole
from src.core.security import create_access_token, hash_password, verify_password
from src.db.deps import DBSession
from src.models.user import User
from src.schemas.auth import LoginIn, RegisterIn
from src.schemas.common import Token
from src.schemas.user import UserOut
from src.services.audit import write_audit

router = APIRouter()


@router.post("/register", response_model=UserOut)
def register(payload: RegisterIn, db: DBSession):
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        middle_name=payload.middle_name,
        role=UserRole.employee.value,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    write_audit(db, None, "register", "user", user.id, None, {"email": user.email})
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    db: DBSession,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user = db.scalar(select(User).where(User.email == form_data.username))

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return Token(
        access_token=create_access_token(user.email),
        token_type="bearer",
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
