from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.course import Course
from src.models.course_lesson import CourseLesson
from src.models.course_module import CourseModule
from src.models.enrollment import Enrollment
from src.models.lesson_progress import LessonProgress
from src.models.user import User
from src.schemas.enrollment import EnrollmentCreate, EnrollmentOut
from src.services.audit import write_audit
from src.services.calendar_sync import create_internal_calendar_events_for_enrollment, sync_calendar_event
from src.services.certificates import create_internal_certificate
from src.services.notifications import push_notification

router = APIRouter()


@router.get("/mine", response_model=list[EnrollmentOut])
def my_enrollments(db: DBSession, current_user: User = Depends(get_current_user)):
    return list(db.scalars(select(Enrollment).where(Enrollment.user_id == current_user.id)).all())


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
    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=payload.course_id,
        status="in_progress",
        started_at=datetime.now(timezone.utc),
        source="self_enrolled",
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
    if current_user.role == "employee" and enrollment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    enrollment.status = "completed"
    enrollment.progress_percent = 100
    enrollment.completed_at = datetime.now(timezone.utc)
    enrollment.updated_at = datetime.now(timezone.utc)

    course = db.get(Course, enrollment.course_id)
    if course and course.has_certificate and course.course_type == "internal":
        create_internal_certificate(db, enrollment.user_id, enrollment.course_id, enrollment.id)
        push_notification(db, enrollment.user_id, "certificate", "Сертификат готов", f"По курсу: {course.title}", "course", course.id)

    write_audit(db, current_user.id, "complete", "enrollment", enrollment.id, None, {"status": "completed"})
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.post("/{enrollment_id}/lessons/{lesson_id}/complete", response_model=EnrollmentOut)
def complete_lesson(enrollment_id: str, lesson_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if current_user.role == "employee" and enrollment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
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

    lesson_ids = db.scalars(
        select(CourseLesson.id)
        .join(CourseModule, CourseLesson.module_id == CourseModule.id)
        .where(CourseModule.course_id == enrollment.course_id)
    ).all()
    done = db.scalars(
        select(LessonProgress)
        .where(LessonProgress.enrollment_id == enrollment_id, LessonProgress.lesson_id.in_(lesson_ids), LessonProgress.is_completed == True)
    ).all()
    enrollment.progress_percent = round((len(done) / len(lesson_ids)) * 100, 2) if lesson_ids else 0
    enrollment.updated_at = now
    if lesson_ids and len(done) == len(lesson_ids):
        enrollment.status = "completed"
        enrollment.completed_at = now
    write_audit(db, current_user.id, "complete_lesson", "lesson_progress", progress.id, None, {"lesson_id": lesson_id})
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/user/{user_id}", response_model=list[EnrollmentOut])
def user_enrollments(user_id: str, db: DBSession, _: User = Depends(require_roles("admin", "hr", "manager"))):
    return list(db.scalars(select(Enrollment).where(Enrollment.user_id == user_id)).all())
