from datetime import datetime, timezone, time, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.calendar_event import CalendarEvent
from src.models.course import Course
from src.models.course_lesson import CourseLesson
from src.models.course_module import CourseModule
from src.models.course_session import CourseSession
from src.models.enrollment import Enrollment
from src.models.external_course_request import ExternalCourseRequest
from src.models.user import User
from src.services.outlook_graph import create_graph_event


def create_internal_calendar_event_for_request(db: Session, req: ExternalCourseRequest, title_suffix: str = "") -> CalendarEvent:
    title = req.title if not title_suffix else f"{req.title} — {title_suffix}"
    description_parts = [
        f"Провайдер: {req.provider_name}",
        f"Обоснование: {req.justification}",
    ]
    if req.program_description:
        description_parts.append(req.program_description)

    event = CalendarEvent(
        user_id=req.requester_id,
        course_id=req.approved_course_id,
        external_request_id=req.id,
        title=title,
        description="\n".join(description_parts),
        starts_at=datetime.combine(req.requested_start_date, time.min, tzinfo=timezone.utc) if req.requested_start_date else None,
        ends_at=datetime.combine(req.requested_end_date, time.max, tzinfo=timezone.utc) if req.requested_end_date else None,
        source="external_request",
        sync_provider="internal",
        sync_status="created",
        location="Внешнее обучение",
        priority=30,
        event_kind="scheduled",
        is_reminder_only=False,
    )
    db.add(event)
    db.flush()
    return event


def _lesson_window(enrollment: Enrollment, module_index: int, lesson: CourseLesson):
    start_base = enrollment.started_at or enrollment.created_at or datetime.now(timezone.utc)
    start = start_base + timedelta(days=(module_index * 7) + (lesson.order_index - 1) * 2)
    end = start + timedelta(minutes=lesson.estimated_minutes or 45)
    return start, end


def create_internal_calendar_events_for_enrollment(db: Session, enrollment: Enrollment) -> list[CalendarEvent]:
    course = db.get(Course, enrollment.course_id)
    if not course or course.course_type != "internal":
        return []
    sessions = list(db.scalars(select(CourseSession).where(CourseSession.course_id == course.id).order_by(CourseSession.starts_at.asc())).all())
    events: list[CalendarEvent] = []
    if sessions:
        for session in sessions:
            exists = db.scalar(select(CalendarEvent).where(
                CalendarEvent.user_id == enrollment.user_id,
                CalendarEvent.course_id == enrollment.course_id,
                CalendarEvent.source == "internal_group_session",
                CalendarEvent.title == f"{course.title} · {session.title}"
            ))
            if exists:
                events.append(exists)
                continue
            event = CalendarEvent(
                user_id=enrollment.user_id,
                course_id=enrollment.course_id,
                title=f"{course.title} · {session.title}",
                description=f"Офлайн/групповая сессия внутреннего курса.\nЛокация: {session.location or 'Учебный класс ALROSA'}",
                starts_at=session.starts_at,
                ends_at=session.ends_at,
                source="internal_group_session",
                sync_provider="internal",
                sync_status="created",
                location=session.location or "Учебный класс ALROSA",
                meeting_url=session.meeting_url,
                priority=100,
                event_kind="group_offline",
                is_reminder_only=False,
            )
            db.add(event)
            db.flush()
            events.append(event)
        return events

    modules = list(db.scalars(select(CourseModule).where(CourseModule.course_id == course.id).order_by(CourseModule.order_index)).all())
    for module_index, module in enumerate(modules):
        lessons = list(db.scalars(select(CourseLesson).where(CourseLesson.module_id == module.id).order_by(CourseLesson.order_index)).all())
        for lesson in lessons:
            exists = db.scalar(select(CalendarEvent).where(
                CalendarEvent.user_id == enrollment.user_id,
                CalendarEvent.course_id == enrollment.course_id,
                CalendarEvent.source == "internal_lesson",
                CalendarEvent.title == f"{course.title} · {module.title} · {lesson.title}"
            ))
            if exists:
                events.append(exists)
                continue
            starts_at, ends_at = _lesson_window(enrollment, module_index, lesson)
            event = CalendarEvent(
                user_id=enrollment.user_id,
                course_id=enrollment.course_id,
                title=f"{course.title} · {module.title} · {lesson.title}",
                description=(lesson.content or "Внутреннее задание Alrosa LearnFlow") + f"\n\nМодуль: {module.title}\nТип: {lesson.lesson_type}",
                starts_at=starts_at,
                ends_at=ends_at,
                source="internal_lesson",
                sync_provider="internal",
                sync_status="created",
                location="Alrosa LearnFlow / Внутренний курс",
                priority=90,
                event_kind="scheduled",
                is_reminder_only=False,
            )
            db.add(event)
            db.flush()
            events.append(event)
    return events


def has_internal_conflict(db: Session, user_id: str, starts_at: datetime | None, ends_at: datetime | None) -> bool:
    if not starts_at or not ends_at:
        return False
    conflict = db.scalar(
        select(CalendarEvent).where(
            CalendarEvent.user_id == user_id,
            CalendarEvent.priority >= 90,
            CalendarEvent.starts_at.is_not(None),
            CalendarEvent.ends_at.is_not(None),
            CalendarEvent.starts_at < ends_at,
            CalendarEvent.ends_at > starts_at,
        )
    )
    return conflict is not None


def create_external_assignment_event(db: Session, user_id: str, course_id: str, title: str, description: str, due_at: datetime) -> tuple[CalendarEvent, bool, str | None]:
    starts_at = due_at.replace(hour=10, minute=0, second=0, microsecond=0)
    ends_at = starts_at + timedelta(hours=1)
    conflict = has_internal_conflict(db, user_id, starts_at, ends_at)
    if conflict:
        event = CalendarEvent(
            user_id=user_id,
            course_id=course_id,
            title=f"Напоминание: {title}",
            description=description + "\n\nВнешний курс переведен в режим напоминания, потому что в это время есть внутренний приоритетный курс.",
            starts_at=due_at.replace(hour=9, minute=0, second=0, microsecond=0),
            ends_at=due_at.replace(hour=9, minute=15, second=0, microsecond=0),
            source="external_course",
            sync_provider="internal",
            sync_status="created",
            location="Напоминание о внешнем курсе",
            priority=20,
            event_kind="reminder",
            is_reminder_only=True,
        )
        db.add(event)
        db.flush()
        return event, True, "Найдено пересечение с внутренним курсом: внешний курс добавлен как напоминание по сроку."
    event = CalendarEvent(
        user_id=user_id,
        course_id=course_id,
        title=title,
        description=description,
        starts_at=starts_at,
        ends_at=ends_at,
        source="external_course",
        sync_provider="internal",
        sync_status="created",
        location="Онлайн-внешний курс",
        priority=30,
        event_kind="scheduled",
        is_reminder_only=False,
    )
    db.add(event)
    db.flush()
    return event, False, None


def sync_calendar_event(db: Session, event: CalendarEvent) -> CalendarEvent:
    return create_graph_event(db, str(event.user_id), event)


def resync_internal_course_events_for_user(db: Session, user: User) -> dict:
    enrollments = list(db.scalars(select(Enrollment).where(Enrollment.user_id == user.id)).all())
    created = 0
    synced = 0
    for enrollment in enrollments:
        events = create_internal_calendar_events_for_enrollment(db, enrollment)
        created += len(events)
        for event in events:
            if event.sync_status != "synced":
                sync_calendar_event(db, event)
                if event.sync_status == "synced":
                    synced += 1
    db.flush()
    return {"created": created, "synced": synced}
