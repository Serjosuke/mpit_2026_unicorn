import base64
import hashlib
from cryptography.fernet import Fernet

from src.core.config import settings


def _get_fernet() -> Fernet:
    if not settings.outlook_token_encryption_key:
        raise RuntimeError("OUTLOOK_TOKEN_ENCRYPTION_KEY is not configured")
    raw = settings.outlook_token_encryption_key.encode("utf-8")
    key = base64.urlsafe_b64encode(hashlib.sha256(raw).digest())
    return Fernet(key)


def encrypt_text(value: str) -> str:
    return _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_text(value: str) -> str:
    return _get_fernet().decrypt(value.encode("utf-8")).decode("utf-8")
