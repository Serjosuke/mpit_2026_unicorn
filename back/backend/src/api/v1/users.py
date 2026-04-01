from datetime import datetime, timedelta, timezone, date
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.core.security import hash_password
from src.db.deps import DBSession
from src.models.certificate import Certificate
from src.models.course import Course
from src.models.course_lesson import CourseLesson
from src.models.course_module import CourseModule
from src.models.department import Department
from src.models.enrollment import Enrollment
from src.models.lesson_progress import LessonProgress
from src.models.user import User
from src.schemas.user import UserCreate, UserOut, UserUpdate
from src.services.audit import write_audit

router = APIRouter()


def _full_name(user: User) -> str:
    return " ".join(x for x in [user.last_name, user.first_name, user.middle_name] if x)


def _extract_external_due_date(enrollment: Enrollment, course: Course) -> date | None:
    if enrollment.target_completion_date:
        return enrollment.target_completion_date
    description = course.description or ""
    match = re.search(r"Срок:\s*(\d{4}-\d{2}-\d{2})", description)
    if not match:
        return None
    try:
        return date.fromisoformat(match.group(1))
    except ValueError:
        return None


def _next_internal_due_date(db: DBSession, enrollment: Enrollment) -> datetime | None:
    modules = list(
        db.scalars(
            select(CourseModule)
            .where(CourseModule.course_id == enrollment.course_id)
            .order_by(CourseModule.order_index)
        ).all()
    )
    if not modules:
        return None

    base = enrollment.started_at or enrollment.created_at or datetime.now(timezone.utc)
    progress_rows = {
        row.lesson_id: row
        for row in db.scalars(select(LessonProgress).where(LessonProgress.enrollment_id == enrollment.id)).all()
    }
    due_candidates: list[datetime] = []
    for module_index, module in enumerate(modules):
        lessons = list(
            db.scalars(
                select(CourseLesson)
                .where(CourseLesson.module_id == module.id)
                .order_by(CourseLesson.order_index)
            ).all()
        )
        for lesson in lessons:
            progress = progress_rows.get(lesson.id)
            if progress and progress.is_completed:
                continue
            due_at = base + timedelta(days=(module_index * 7) + lesson.order_index * 2)
            due_candidates.append(due_at)
    if not due_candidates:
        return None
    return min(due_candidates)


def _priority_score(due_at: datetime | None, progress_percent: float) -> float:
    score = max(0.0, 100.0 - float(progress_percent or 0))
    if due_at is None:
        return round(score, 2)
    now = datetime.now(timezone.utc)
    delta_days = (due_at - now).total_seconds() / 86400
    if delta_days <= 0:
        score += 160
    elif delta_days <= 3:
        score += 130 - (delta_days * 10)
    elif delta_days <= 7:
        score += 95 - (delta_days * 6)
    elif delta_days <= 14:
        score += 60 - (delta_days * 2)
    elif delta_days <= 30:
        score += 25
    return round(score, 2)


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
    enrollments = list(
        db.scalars(
            select(Enrollment)
            .where(Enrollment.user_id == user.id)
            .order_by(Enrollment.updated_at.desc(), Enrollment.created_at.desc())
        ).all()
    )
    certificates = list(db.scalars(select(Certificate).where(Certificate.user_id == user.id).order_by(Certificate.created_at.desc())).all())

    active_courses = []
    for enrollment in enrollments:
        course = db.get(Course, enrollment.course_id)
        if not course or enrollment.status == "completed":
            continue

        if course.course_type == "internal":
            due_at = _next_internal_due_date(db, enrollment)
        else:
            due_date = _extract_external_due_date(enrollment, course)
            due_at = datetime.combine(due_date, datetime.min.time(), tzinfo=timezone.utc) if due_date else None

        active_courses.append(
            {
                "enrollment_id": str(enrollment.id),
                "course_id": str(enrollment.course_id),
                "course_title": course.title,
                "status": enrollment.status,
                "progress_percent": float(enrollment.progress_percent),
                "updated_at": enrollment.updated_at.isoformat() if enrollment.updated_at else None,
                "deadline_at": due_at.isoformat() if due_at else None,
                "course_type": course.course_type,
                "priority_score": _priority_score(due_at, float(enrollment.progress_percent or 0)),
            }
        )

    active_courses.sort(key=lambda item: (item["priority_score"], item["deadline_at"] or "9999-12-31T00:00:00+00:00"), reverse=True)

    return {
        "user": {
            "id": str(user.id),
            "full_name": _full_name(user),
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
        "courses": active_courses[:3],
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
