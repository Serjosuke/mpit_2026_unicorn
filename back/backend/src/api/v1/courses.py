from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.course import Course
from src.models.course_lesson import CourseLesson
from src.models.course_module import CourseModule
from src.models.course_session import CourseSession
from src.models.enrollment import Enrollment
from src.models.lesson_progress import LessonProgress
from src.models.user import User
from src.schemas.course import (
    CourseCreate,
    CourseOut,
    CourseTrackOut,
    FavoriteExternalCourseIn,
    GroupEnrollmentIn,
    HRBulkExternalAssignIn,
    HRBulkExternalAssignOut,
    HRExternalAssignIn,
    HRExternalAssignOut,
    LessonTrackOut,
    ManagerInternalCourseCreateIn,
    ModuleTrackOut,
    SmartSearchOut,
)
from src.services.audit import write_audit
from src.services.calendar_sync import (
    create_external_assignment_event,
    create_internal_calendar_events_for_enrollment,
    sync_calendar_event,
)
from src.services.external_course_search import role_suggestions
from src.services.notifications import push_notification
from src.services.smart_catalog import search_catalog

router = APIRouter()


def _course_counts(db: DBSession, course_id: str) -> tuple[int, int, int]:
    rows = list(db.scalars(select(Enrollment.status).where(Enrollment.course_id == course_id)).all())
    total = len(rows)
    active = len([status for status in rows if status in {"enrolled", "in_progress"}])
    completed = len([status for status in rows if status == "completed"])
    return total, active, completed


def _course_session_days(db: DBSession, course_id: str) -> list[str]:
    sessions = list(
        db.scalars(
            select(CourseSession).where(CourseSession.course_id == course_id).order_by(CourseSession.starts_at.asc())
        ).all()
    )
    return [
        f"{session.title}: {session.starts_at.astimezone(timezone.utc).strftime('%d.%m %H:%M')}–{session.ends_at.astimezone(timezone.utc).strftime('%H:%M')}"
        for session in sessions
    ]


def _serialize_course(db: DBSession, course: Course) -> dict:
    total, active, completed = _course_counts(db, str(course.id))
    return {
        "id": course.id,
        "title": course.title,
        "slug": course.slug,
        "description": course.description,
        "summary": course.summary,
        "skill_tags": course.skill_tags,
        "level": course.level,
        "delivery_mode": course.delivery_mode,
        "source_priority": course.source_priority,
        "is_featured_internal": course.is_featured_internal,
        "course_type": course.course_type,
        "status": course.status,
        "category_id": course.category_id,
        "provider_name": course.provider_name,
        "provider_url": course.provider_url,
        "duration_hours": float(course.duration_hours) if course.duration_hours is not None else None,
        "created_at": course.created_at,
        "created_by": course.created_by,
        "total_enrollments_count": total,
        "active_enrollments_count": active,
        "completed_enrollments_count": completed,
        "session_days": _course_session_days(db, str(course.id)),
    }


@router.get("/", response_model=list[CourseOut])
def list_courses(db: DBSession, current_user: User = Depends(get_current_user)):
    stmt = select(Course).order_by(Course.source_priority.asc(), Course.created_at.desc())
    if current_user.role == "employee":
        stmt = stmt.where(Course.status == "published")
    courses = list(db.scalars(stmt).all())
    return [_serialize_course(db, course) for course in courses]


@router.get("/external-search", response_model=SmartSearchOut)
def external_search_courses(
    db: DBSession,
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
):
    normalized, results = search_catalog(db, q, audience_role=current_user.role)
    return SmartSearchOut(query=q, normalized_query=normalized, results=results)


@router.get("/smart-search", response_model=SmartSearchOut)
def smart_search_courses(
    db: DBSession,
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
):
    normalized, results = search_catalog(db, q, audience_role=current_user.role)
    return SmartSearchOut(query=q, normalized_query=normalized, results=results)


@router.get("/role-suggestions")
def list_role_suggestions(q: str | None = None):
    return {"items": role_suggestions(q)}


@router.post("/favorite-external", response_model=CourseOut)
def favorite_external_course(payload: FavoriteExternalCourseIn, db: DBSession, current_user: User = Depends(require_roles("hr", "admin"))):
    course = db.scalar(select(Course).where(Course.provider_url == payload.provider_url, Course.course_type == "external"))
    if not course:
        course = Course(
            title=payload.title,
            slug=f"fav-{uuid4().hex[:12]}",
            description=payload.description or payload.summary,
            summary=payload.summary,
            skill_tags=payload.skill_tags,
            level=payload.level,
            delivery_mode=payload.delivery_mode,
            source_priority=5,
            is_featured_internal=True,
            course_type="external",
            provider_name=payload.provider_name,
            provider_url=payload.provider_url,
            created_by=current_user.id,
            duration_hours=payload.duration_hours,
            price_amount=payload.price_amount,
            price_currency=payload.price_currency,
            requires_approval=True,
            status="published",
            has_certificate=True,
        )
        db.add(course)
    else:
        course.title = payload.title
        course.description = payload.description or course.description
        course.summary = payload.summary or course.summary
        course.skill_tags = payload.skill_tags or course.skill_tags
        course.level = payload.level or course.level
        course.delivery_mode = payload.delivery_mode or course.delivery_mode
        course.provider_name = payload.provider_name
        course.is_featured_internal = True
        course.source_priority = 5
        course.status = "published"
    db.flush()
    write_audit(db, current_user.id, "favorite_external", "course", course.id, None, {"provider_url": payload.provider_url})
    db.commit()
    db.refresh(course)
    return _serialize_course(db, course)



def _create_external_assignment(payload: HRExternalAssignIn, employee: User, db: DBSession, current_user: User):
    shared_course = db.scalar(
        select(Course)
        .where(
            Course.course_type == "external",
            Course.title == payload.title,
            Course.provider_url == payload.provider_url,
        )
        .order_by(Course.is_featured_internal.desc(), Course.created_at.asc())
    )
    if not shared_course:
        shared_course = Course(
            title=payload.title,
            slug=f"hr-external-{uuid4().hex[:10]}",
            description=payload.description or payload.summary,
            summary=payload.summary,
            skill_tags=None,
            level=payload.level,
            delivery_mode=payload.delivery_mode,
            source_priority=payload.source_priority,
            course_type="external",
            provider_name=payload.provider_name,
            provider_url=payload.provider_url,
            created_by=current_user.id,
            duration_hours=payload.duration_hours,
            price_amount=payload.price_amount,
            price_currency=payload.price_currency,
            requires_approval=False,
            status="published",
            has_certificate=True,
        )
        db.add(shared_course)
        db.flush()
    else:
        shared_course.title = payload.title
        shared_course.description = payload.description or shared_course.description
        shared_course.summary = payload.summary or shared_course.summary
        shared_course.level = payload.level or shared_course.level
        shared_course.delivery_mode = payload.delivery_mode or shared_course.delivery_mode
        shared_course.provider_name = payload.provider_name or shared_course.provider_name
        shared_course.duration_hours = payload.duration_hours or shared_course.duration_hours
        shared_course.status = "published"

    existing = db.scalar(
        select(Enrollment)
        .where(
            Enrollment.user_id == employee.id,
            Enrollment.course_id == shared_course.id,
            Enrollment.status.in_(["enrolled", "in_progress", "completed"]),
        )
        .order_by(Enrollment.created_at.desc())
    )
    if existing:
        return shared_course, existing, None, True, "Курс уже был назначен этому сотруднику"

    enrollment = Enrollment(
        user_id=employee.id,
        course_id=shared_course.id,
        status="in_progress",
        started_at=datetime.now(timezone.utc),
        source="hr_assigned_external",
        target_completion_date=payload.due_date,
    )
    db.add(enrollment)
    db.flush()
    description = (payload.summary or payload.description or "Внешний онлайн-курс") + f"\nСсылка: {payload.provider_url}\nСрок: {payload.due_date.isoformat()}"
    due_at = datetime.combine(payload.due_date, datetime.min.time(), tzinfo=timezone.utc)
    event, reminder_only, reason = create_external_assignment_event(db, str(employee.id), str(shared_course.id), shared_course.title, description, due_at)
    sync_calendar_event(db, event)
    push_notification(db, employee.id, "assignment", "HR назначил внешний курс", shared_course.title, "course", shared_course.id)
    push_notification(db, employee.id, "calendar", "Курс добавлен в календарь", shared_course.title, "calendar_event", event.id)
    write_audit(db, current_user.id, "assign_external", "course", shared_course.id, None, {"employee_id": str(employee.id), "reminder_only": reminder_only})
    return shared_course, enrollment, event, reminder_only, reason


@router.post("/assign-external", response_model=HRExternalAssignOut)
def assign_external_course(payload: HRExternalAssignIn, db: DBSession, current_user: User = Depends(require_roles("hr", "admin"))):
    employee = db.get(User, payload.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    course, enrollment, event, reminder_only, reason = _create_external_assignment(payload, employee, db, current_user)
    if not course or not enrollment:
        raise HTTPException(status_code=400, detail="Не удалось назначить курс")
    db.commit()
    db.refresh(course)
    return HRExternalAssignOut(
        course=_serialize_course(db, course),
        enrollment_id=enrollment.id,
        calendar_event_id=event.id if event else enrollment.id,
        conflict_handled_as_reminder=reminder_only,
        conflict_reason=reason,
    )


@router.post("/assign-external-bulk", response_model=HRBulkExternalAssignOut)
def assign_external_course_bulk(payload: HRBulkExternalAssignIn, db: DBSession, current_user: User = Depends(require_roles("hr", "admin"))):
    created = 0
    reminders = 0
    course_ids = []
    for user_id in payload.user_ids:
        employee = db.get(User, user_id)
        if not employee:
            continue
        item = HRExternalAssignIn(**payload.model_dump(exclude={"user_ids"}), employee_id=user_id)
        course, enrollment, _, reminder_only, reason = _create_external_assignment(item, employee, db, current_user)
        if not course or not enrollment or reason == "Курс уже был назначен этому сотруднику":
            continue
        created += 1
        reminders += 1 if reminder_only else 0
        course_ids.append(course.id)
    db.commit()
    return HRBulkExternalAssignOut(created=created, reminders=reminders, course_ids=course_ids)


@router.post("/group-enroll")
def group_enroll_internal(payload: GroupEnrollmentIn, db: DBSession, current_user: User = Depends(require_roles("hr", "admin", "trainer"))):
    course = db.get(Course, payload.course_id)
    if not course or course.course_type != "internal":
        raise HTTPException(status_code=400, detail="Internal course not found")
    created = 0
    for user_id in payload.user_ids:
        existing = db.scalar(select(Enrollment).where(Enrollment.user_id == str(user_id), Enrollment.course_id == str(payload.course_id)))
        if existing:
            continue
        enrollment = Enrollment(
            user_id=str(user_id),
            course_id=str(payload.course_id),
            status="in_progress",
            started_at=datetime.now(timezone.utc),
            source="hr_group_internal",
            target_completion_date=(datetime.now(timezone.utc) + timedelta(days=30)).date(),
        )
        db.add(enrollment)
        db.flush()
        for event in create_internal_calendar_events_for_enrollment(db, enrollment):
            sync_calendar_event(db, event)
        push_notification(db, str(user_id), "assignment", "Вы записаны на внутренний курс", course.title, "course", course.id)
        created += 1
    write_audit(db, current_user.id, "group_enroll", "course", course.id, None, {"count": created})
    db.commit()
    return {"created": created}


@router.post("/manager-drafts", response_model=CourseOut)
def create_manager_draft_course(
    payload: ManagerInternalCourseCreateIn,
    db: DBSession,
    current_user: User = Depends(require_roles("manager", "admin", "hr")),
):
    if not payload.modules:
        raise HTTPException(status_code=400, detail="Добавьте хотя бы один раздел курса")

    course = Course(
        title=payload.title,
        slug=f"mgr-{uuid4().hex[:12]}",
        description=payload.description,
        summary=payload.summary,
        skill_tags=payload.skill_tags,
        level=payload.level,
        delivery_mode=payload.delivery_mode,
        source_priority=15,
        is_featured_internal=False,
        course_type="internal",
        provider_name=payload.provider_name or "ALROSA LearnFlow",
        provider_url=None,
        created_by=current_user.id,
        duration_hours=payload.duration_hours,
        price_amount=None,
        price_currency=None,
        is_mandatory=False,
        requires_approval=False,
        has_certificate=True,
        status="pending_hr_approval",
    )
    db.add(course)
    db.flush()

    for module_index, module in enumerate(payload.modules, start=1):
        db_module = CourseModule(
            course_id=course.id,
            title=module.title,
            description=module.description,
            order_index=module_index,
            content_type="module",
            content_url=None,
            estimated_minutes=sum((lesson.estimated_minutes or 20) for lesson in module.lessons) if module.lessons else None,
            is_required=True,
        )
        db.add(db_module)
        db.flush()
        for lesson_index, lesson in enumerate(module.lessons, start=1):
            db.add(
                CourseLesson(
                    module_id=db_module.id,
                    title=lesson.title,
                    order_index=lesson_index,
                    lesson_type="task",
                    content=lesson.content,
                    content_url=None,
                    estimated_minutes=lesson.estimated_minutes or 20,
                    is_required=True,
                )
            )

    for session in payload.sessions:
        db.add(
            CourseSession(
                course_id=course.id,
                title=session.title,
                starts_at=session.starts_at,
                ends_at=session.ends_at,
                timezone="Europe/Moscow",
                location=session.location,
                meeting_url=session.meeting_url,
                outlook_sync_status="pending",
            )
        )

    write_audit(db, current_user.id, "create_manager_draft", "course", course.id, None, {"title": course.title})
    db.commit()
    db.refresh(course)
    return _serialize_course(db, course)


@router.post("/{course_id}/hr-approve", response_model=CourseOut)
def hr_approve_course(course_id: str, db: DBSession, current_user: User = Depends(require_roles("hr", "admin"))):
    course = db.get(Course, course_id)
    if not course or course.course_type != "internal":
        raise HTTPException(status_code=404, detail="Курс не найден")
    course.status = "published"
    write_audit(db, current_user.id, "hr_approve_course", "course", course.id, None, {"status": "published"})
    db.commit()
    db.refresh(course)
    return _serialize_course(db, course)


@router.post("/{course_id}/hr-reject", response_model=CourseOut)
def hr_reject_course(course_id: str, db: DBSession, current_user: User = Depends(require_roles("hr", "admin"))):
    course = db.get(Course, course_id)
    if not course or course.course_type != "internal":
        raise HTTPException(status_code=404, detail="Курс не найден")
    course.status = "rejected_by_hr"
    write_audit(db, current_user.id, "hr_reject_course", "course", course.id, None, {"status": "rejected_by_hr"})
    db.commit()
    db.refresh(course)
    return _serialize_course(db, course)


@router.post("/", response_model=CourseOut)
def create_course(payload: CourseCreate, db: DBSession, current_user: User = Depends(require_roles("admin", "hr", "trainer"))):
    exists = db.scalar(select(Course).where(Course.slug == payload.slug))
    if exists:
        raise HTTPException(status_code=400, detail="Slug already exists")
    course = Course(**payload.model_dump(), created_by=current_user.id)
    db.add(course)
    db.flush()
    write_audit(db, current_user.id, "create", "course", course.id, None, {"title": course.title, "slug": course.slug})
    db.commit()
    db.refresh(course)
    return _serialize_course(db, course)


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == "employee" and course.status != "published":
        raise HTTPException(status_code=403, detail="Forbidden")
    return _serialize_course(db, course)



def _deadline_status(due_at: datetime | None, is_completed: bool) -> str:
    if is_completed:
        return "done"
    if due_at is None:
        return "normal"
    now = datetime.now(timezone.utc)
    if due_at < now:
        return "danger"
    if due_at - now <= timedelta(hours=24):
        return "warning"
    return "normal"


@router.get("/{course_id}/track", response_model=CourseTrackOut)
def get_course_track(course_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollment = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.user_id == current_user.id))
    progress_rows = {}
    if enrollment:
        progress_rows = {row.lesson_id: row for row in db.scalars(select(LessonProgress).where(LessonProgress.enrollment_id == enrollment.id)).all()}
    modules = list(db.scalars(select(CourseModule).where(CourseModule.course_id == course_id).order_by(CourseModule.order_index)).all())
    modules_payload: list[ModuleTrackOut] = []
    total_lessons = 0
    completed = 0
    overdue = 0
    base = enrollment.started_at if enrollment and enrollment.started_at else datetime.now(timezone.utc)
    for module_index, module in enumerate(modules):
        lessons = list(db.scalars(select(CourseLesson).where(CourseLesson.module_id == module.id).order_by(CourseLesson.order_index)).all())
        lesson_payloads: list[LessonTrackOut] = []
        for lesson in lessons:
            total_lessons += 1
            pr = progress_rows.get(lesson.id)
            due_at = base + timedelta(days=(module_index * 7) + lesson.order_index * 2)
            status = _deadline_status(due_at, bool(pr and pr.is_completed))
            if pr and pr.is_completed:
                completed += 1
            elif status == "danger":
                overdue += 1
            lesson_payloads.append(
                LessonTrackOut(
                    id=lesson.id,
                    title=lesson.title,
                    order_index=lesson.order_index,
                    lesson_type=lesson.lesson_type,
                    content=lesson.content,
                    estimated_minutes=lesson.estimated_minutes,
                    is_completed=bool(pr and pr.is_completed),
                    completed_at=pr.completed_at if pr else None,
                    due_at=due_at,
                    deadline_status=status,
                )
            )
        modules_payload.append(
            ModuleTrackOut(
                id=module.id,
                title=module.title,
                description=module.description,
                order_index=module.order_index,
                lessons=lesson_payloads,
            )
        )
    progress_percent = round((completed / total_lessons) * 100, 2) if total_lessons else 0
    active_lessons = max(total_lessons - completed, 0)
    if enrollment and enrollment.progress_percent != progress_percent:
        enrollment.progress_percent = progress_percent
        db.commit()
    return CourseTrackOut(
        course=_serialize_course(db, course),
        enrollment_id=enrollment.id if enrollment else None,
        progress_percent=progress_percent,
        active_lessons=active_lessons,
        completed_lessons=completed,
        overdue_lessons=overdue,
        modules=modules_payload,
    )
