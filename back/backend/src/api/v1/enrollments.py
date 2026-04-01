from datetime import datetime, timedelta, timezone, date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.certificate import Certificate
from src.models.course import Course
from src.models.course_lesson import CourseLesson
from src.models.course_module import CourseModule
from src.models.enrollment import Enrollment
from src.models.file_asset import FileAsset
from src.models.lesson_progress import LessonProgress
from src.models.user import User
from src.schemas.enrollment import EnrollmentCreate, EnrollmentOut, EnrollmentProgressUpdate
from src.services.audit import write_audit
from src.services.calendar_sync import create_internal_calendar_events_for_enrollment, sync_calendar_event
from src.services.certificates import create_internal_certificate
from src.services.file_storage import save_upload
from src.services.notifications import push_notification

router = APIRouter()


def _ensure_access(enrollment: Enrollment, current_user: User):
    if current_user.role == "employee" and enrollment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")


def _course_lesson_ids(db: DBSession, course_id: str):
    return list(
        db.scalars(
            select(CourseLesson.id)
            .join(CourseModule, CourseLesson.module_id == CourseModule.id)
            .where(CourseModule.course_id == course_id)
        ).all()
    )


def _default_internal_target(started_at: datetime, lesson_count: int) -> date:
    days = max(14, lesson_count * 4, 30)
    return (started_at + timedelta(days=days)).date()


@router.get("/mine", response_model=list[EnrollmentOut])
def my_enrollments(db: DBSession, current_user: User = Depends(get_current_user)):
    return list(
        db.scalars(
            select(Enrollment)
            .where(Enrollment.user_id == current_user.id)
            .order_by(Enrollment.updated_at.desc(), Enrollment.created_at.desc())
        ).all()
    )


@router.post("/", response_model=EnrollmentOut)
def enroll(payload: EnrollmentCreate, db: DBSession, current_user: User = Depends(get_current_user)):
    course = db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.course_type == "external" and course.requires_approval:
        raise HTTPException(status_code=400, detail="External course requires approval workflow")
    existing = db.scalar(select(Enrollment).where(Enrollment.user_id == current_user.id, Enrollment.course_id == payload.course_id))
    if existing:
        return existing

    started_at = datetime.now(timezone.utc)
    target_completion_date = None
    if course.course_type == "internal":
        lesson_count = len(_course_lesson_ids(db, str(course.id)))
        target_completion_date = _default_internal_target(started_at, lesson_count)

    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=payload.course_id,
        status="in_progress",
        started_at=started_at,
        source="self_enrolled",
        target_completion_date=target_completion_date,
    )
    db.add(enrollment)
    db.flush()
    if course.course_type == "internal":
        for event in create_internal_calendar_events_for_enrollment(db, enrollment):
            sync_calendar_event(db, event)
    push_notification(db, current_user.id, "enrollment", "Вы записаны на курс", f"Курс: {course.title}", "course", course.id)
    write_audit(db, current_user.id, "enroll", "enrollment", enrollment.id, None, {"course_id": str(course.id)})
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.post("/{enrollment_id}/complete", response_model=EnrollmentOut)
def complete_enrollment(enrollment_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    _ensure_access(enrollment, current_user)

    course = db.get(Course, enrollment.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.course_type == "internal":
        lesson_ids = _course_lesson_ids(db, str(course.id))
        done = list(
            db.scalars(
                select(LessonProgress).where(
                    LessonProgress.enrollment_id == enrollment.id,
                    LessonProgress.lesson_id.in_(lesson_ids),
                    LessonProgress.is_completed == True,
                )
            ).all()
        ) if lesson_ids else []
        if lesson_ids and len(done) != len(lesson_ids):
            raise HTTPException(status_code=400, detail="Внутренний курс можно завершить только после выполнения всех заданий")

    if course.course_type == "external":
        certificate = db.scalar(select(Certificate).where(Certificate.enrollment_id == enrollment.id))
        if not certificate:
            raise HTTPException(status_code=400, detail="Для завершения внешнего курса сначала загрузите сертификат")

    enrollment.status = "completed"
    enrollment.progress_percent = 100
    enrollment.completed_at = datetime.now(timezone.utc)
    enrollment.updated_at = datetime.now(timezone.utc)

    if course.has_certificate and course.course_type == "internal":
        existing_certificate = db.scalar(select(Certificate).where(Certificate.enrollment_id == enrollment.id))
        if not existing_certificate:
            create_internal_certificate(db, enrollment.user_id, enrollment.course_id, enrollment.id)
            push_notification(db, enrollment.user_id, "certificate", "Сертификат готов", f"По курсу: {course.title}", "course", course.id)

    write_audit(db, current_user.id, "complete", "enrollment", enrollment.id, None, {"status": "completed"})
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.patch("/{enrollment_id}/progress", response_model=EnrollmentOut)
def update_external_progress(
    enrollment_id: str,
    payload: EnrollmentProgressUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    _ensure_access(enrollment, current_user)

    course = db.get(Course, enrollment.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.course_type != "external":
        raise HTTPException(status_code=400, detail="Ручное изменение прогресса доступно только для внешних курсов")
    if enrollment.status == "completed":
        raise HTTPException(status_code=400, detail="Курс уже завершён")

    progress = max(0, min(float(payload.progress_percent), 99.0))
    enrollment.progress_percent = round(progress)
    enrollment.updated_at = datetime.now(timezone.utc)
    if enrollment.status == "enrolled":
        enrollment.status = "in_progress"

    write_audit(db, current_user.id, "update_progress", "enrollment", enrollment.id, None, {"progress_percent": enrollment.progress_percent})
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.post("/{enrollment_id}/complete-external", response_model=EnrollmentOut)
def complete_external_enrollment(
    enrollment_id: str,
    db: DBSession,
    current_user: User = Depends(get_current_user),
    source: str = Form("external_course"),
    issuer_name: str | None = Form(default=None),
    certificate_number: str | None = Form(default=None),
    issue_date: str | None = Form(default=None),
    file: UploadFile = File(...),
):
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    _ensure_access(enrollment, current_user)

    course = db.get(Course, enrollment.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.course_type != "external":
        raise HTTPException(status_code=400, detail="Этот сценарий доступен только для внешних курсов")

    allowed = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}
    if (file.content_type or "").lower() not in allowed:
        raise HTTPException(status_code=400, detail="Допустимы PDF, PNG и JPG")

    storage_key, size_bytes = save_upload(file, prefix="certificate")
    asset = FileAsset(
        owner_user_id=current_user.id,
        storage_key=storage_key,
        original_name=file.filename or Path(storage_key).name,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        entity_type="certificate",
        entity_id=current_user.id,
    )
    db.add(asset)
    db.flush()

    cert = Certificate(
        user_id=enrollment.user_id,
        course_id=enrollment.course_id,
        enrollment_id=enrollment.id,
        source=source,
        issuer_name=issuer_name or course.provider_name,
        certificate_number=certificate_number,
        issue_date=date.fromisoformat(issue_date) if issue_date else None,
        file_id=asset.id,
        status="valid",
    )
    db.add(cert)

    enrollment.status = "completed"
    enrollment.progress_percent = 100
    now = datetime.now(timezone.utc)
    enrollment.completed_at = now
    enrollment.updated_at = now

    push_notification(db, enrollment.user_id, "certificate", "Сертификат загружен", f"Внешний курс завершён: {course.title}", "course", course.id)
    write_audit(db, current_user.id, "complete_external", "enrollment", enrollment.id, None, {"certificate_file": asset.original_name})
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.post("/{enrollment_id}/lessons/{lesson_id}/complete", response_model=EnrollmentOut)
def complete_lesson(enrollment_id: str, lesson_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    _ensure_access(enrollment, current_user)
    lesson = db.get(CourseLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = db.scalar(select(LessonProgress).where(LessonProgress.enrollment_id == enrollment_id, LessonProgress.lesson_id == lesson_id))
    now = datetime.now(timezone.utc)
    if not progress:
        progress = LessonProgress(enrollment_id=enrollment_id, lesson_id=lesson_id, is_completed=True, completed_at=now)
        db.add(progress)
    else:
        progress.is_completed = True
        progress.completed_at = now

    lesson_ids = _course_lesson_ids(db, str(enrollment.course_id))
    done = list(
        db.scalars(
            select(LessonProgress)
            .where(
                LessonProgress.enrollment_id == enrollment_id,
                LessonProgress.lesson_id.in_(lesson_ids),
                LessonProgress.is_completed == True,
            )
        ).all()
    ) if lesson_ids else []
    enrollment.progress_percent = round((len(done) / len(lesson_ids)) * 100, 2) if lesson_ids else 0
    enrollment.updated_at = now
    if lesson_ids and len(done) == len(lesson_ids):
        enrollment.status = "completed"
        enrollment.completed_at = now
        course = db.get(Course, enrollment.course_id)
        existing_certificate = db.scalar(select(Certificate).where(Certificate.enrollment_id == enrollment.id))
        if course and course.has_certificate and course.course_type == "internal" and not existing_certificate:
            create_internal_certificate(db, enrollment.user_id, enrollment.course_id, enrollment.id)
            push_notification(db, enrollment.user_id, "certificate", "Сертификат готов", f"По курсу: {course.title}", "course", course.id)
    write_audit(db, current_user.id, "complete_lesson", "lesson_progress", progress.id, None, {"lesson_id": lesson_id})
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/user/{user_id}", response_model=list[EnrollmentOut])
def user_enrollments(user_id: str, db: DBSession, _: User = Depends(require_roles("admin", "hr", "manager"))):
    return list(db.scalars(select(Enrollment).where(Enrollment.user_id == user_id).order_by(Enrollment.updated_at.desc())).all())
