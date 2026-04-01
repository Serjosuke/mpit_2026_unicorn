from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

BASE_DIR = Path('/app/uploads')
BASE_DIR.mkdir(parents=True, exist_ok=True)


def save_upload(upload: UploadFile, prefix: str = 'cert') -> tuple[str, int]:
    ext = Path(upload.filename or '').suffix.lower()
    name = f"{prefix}_{uuid4().hex}{ext}"
    target = BASE_DIR / name
    data = upload.file.read()
    target.write_bytes(data)
    return str(target), len(data)
