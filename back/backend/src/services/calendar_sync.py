from datetime import datetime, timezone, time
from sqlalchemy.orm import Session

from src.models.calendar_event import CalendarEvent
from src.models.external_course_request import ExternalCourseRequest
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
    )
    db.add(event)
    db.flush()
    return event


def sync_calendar_event(db: Session, event: CalendarEvent) -> CalendarEvent:
    return create_graph_event(db, str(event.user_id), event)
