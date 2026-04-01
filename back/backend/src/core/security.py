from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

from src.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def create_signed_state(payload: dict, expires_minutes: int = 15) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    state_payload = {**payload, "exp": exp, "purpose": "outlook_oauth_state"}
    return jwt.encode(state_payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_signed_state(state: str) -> dict:
    return jwt.decode(state, settings.jwt_secret, algorithms=[settings.jwt_alg])
