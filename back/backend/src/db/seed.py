from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.enums import UserRole
from src.core.security import hash_password
from src.core.config import settings
from src.models.course_category import CourseCategory
from src.models.user import User

DEFAULT_CATEGORIES = [
    ("Корпоративные программы", "corporate-programs"),
    ("Личная эффективность", "personal-effectiveness"),
    ("Управленческая эффективность", "managerial-effectiveness"),
    ("Коммуникативная эффективность", "communicative-effectiveness"),
    ("Корпоративная эффективность", "corporate-effectiveness"),
    ("Цифровая эффективность", "digital-effectiveness"),
]


def seed_initial_data(db: Session) -> None:
    admin = db.scalar(select(User).where(User.email == settings.first_superuser_email))
    if not admin:
        admin = User(
            email=settings.first_superuser_email,
            password_hash=hash_password(settings.first_superuser_password),
            first_name="System",
            last_name="Admin",
            role=UserRole.admin.value,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)

    for name, slug in DEFAULT_CATEGORIES:
        exists = db.scalar(select(CourseCategory).where(CourseCategory.slug == slug))
        if not exists:
            db.add(CourseCategory(name=name, slug=slug))

    db.commit()
