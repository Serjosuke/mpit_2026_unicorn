from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.approval_step import ApprovalStep
from src.models.course import Course
from src.models.enrollment import Enrollment
from src.models.external_course_request import ExternalCourseRequest
from src.models.user import User
from src.schemas.external_request import ExternalRequestCreate, ExternalRequestDecisionIn, ExternalRequestOut
from src.services.audit import write_audit
from src.services.calendar_sync import create_internal_calendar_event_for_request, sync_calendar_event
from src.services.notifications import push_notification

router = APIRouter()


def _resolve_hr_approver(db: DBSession, requester_department_id: str | None) -> User | None:
    stmt = select(User).where(User.role.in_(["hr", "admin"]), User.is_active == True)
    if requester_department_id:
        user = db.scalar(
            stmt.where(or_(User.department_id == requester_department_id, User.department_id.is_(None))).order_by(User.created_at.asc())
        )
        if user:
            return user
    return db.scalar(stmt.order_by(User.created_at.asc()))


@router.get("/mine", response_model=list[ExternalRequestOut])
def my_requests(db: DBSession, current_user: User = Depends(get_current_user)):
    stmt = select(ExternalCourseRequest).where(
        ExternalCourseRequest.requester_id == current_user.id
    ).order_by(ExternalCourseRequest.created_at.desc())
    return list(db.scalars(stmt).all())


@router.get("/details/{request_id}", response_model=ExternalRequestOut)
def get_request(request_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    req = db.get(ExternalCourseRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    is_privileged = current_user.role in ["admin", "hr", "manager"]
    if not is_privileged and req.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if current_user.role == "manager":
        requester = db.get(User, req.requester_id)
        if requester and requester.manager_id and requester.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    return req


@router.post("/", response_model=ExternalRequestOut)
def create_request(payload: ExternalRequestCreate, db: DBSession, current_user: User = Depends(get_current_user)):
    request = ExternalCourseRequest(
        requester_id=current_user.id,
        department_id=current_user.department_id,
        status="pending_manager_approval",
        outlook_conflict_status="unchecked",
        **payload.model_dump(),
    )
    db.add(request)
    db.flush()

    if current_user.manager_id:
        db.add(ApprovalStep(request_id=request.id, step_type="manager", approver_id=current_user.manager_id, order_index=1))
    else:
        hr_user = _resolve_hr_approver(db, current_user.department_id)
        if not hr_user:
            raise HTTPException(status_code=400, detail="No HR / L&D approver configured")
        request.status = "pending_hr_approval"
        db.add(ApprovalStep(request_id=request.id, step_type="hr", approver_id=hr_user.id, order_index=1))

    write_audit(db, current_user.id, "create", "external_course_request", request.id, None, {"status": request.status})
    db.commit()
    db.refresh(request)
    return request


@router.get("/pending", response_model=list[ExternalRequestOut])
def pending_requests(db: DBSession, current_user: User = Depends(require_roles("admin", "hr", "manager"))):
    stmt = select(ExternalCourseRequest)
    if current_user.role == "manager":
        stmt = stmt.join(User, User.id == ExternalCourseRequest.requester_id).where(
            ExternalCourseRequest.status == "pending_manager_approval",
            User.manager_id == current_user.id,
        )
    elif current_user.role == "hr":
        stmt = stmt.where(ExternalCourseRequest.status == "pending_hr_approval")
    return list(db.scalars(stmt.order_by(ExternalCourseRequest.created_at.desc())).all())


@router.post("/{request_id}/manager-approve", response_model=ExternalRequestOut)
def manager_approve(request_id: str, payload: ExternalRequestDecisionIn, db: DBSession, current_user: User = Depends(require_roles("manager", "admin"))):
    req = db.get(ExternalCourseRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending_manager_approval":
        raise HTTPException(status_code=400, detail="Request is not waiting for manager approval")

    requester = db.get(User, req.requester_id)
    if current_user.role == "manager" and requester and requester.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot approve requests outside your team")

    hr_user = _resolve_hr_approver(db, req.department_id)
    if not hr_user:
        raise HTTPException(status_code=400, detail="No HR / L&D approver configured")

    req.status = "pending_hr_approval"
    req.manager_comment = payload.comment

    step = db.scalar(select(ApprovalStep).where(ApprovalStep.request_id == req.id, ApprovalStep.step_type == "manager"))
    if step:
        step.decision = "approved"
        step.comment = payload.comment
        step.acted_at = datetime.now(timezone.utc)
    else:
        db.add(
            ApprovalStep(
                request_id=req.id,
                step_type="manager",
                approver_id=current_user.id,
                order_index=1,
                decision="approved",
                comment=payload.comment,
                acted_at=datetime.now(timezone.utc),
            )
        )

    hr_step = db.scalar(select(ApprovalStep).where(ApprovalStep.request_id == req.id, ApprovalStep.step_type == "hr"))
    if not hr_step:
        db.add(ApprovalStep(request_id=req.id, step_type="hr", approver_id=hr_user.id, order_index=2))

    push_notification(db, req.requester_id, "approval", "Заявка прошла этап руководителя", req.title, "external_request", req.id)
    write_audit(db, current_user.id, "manager_approve", "external_course_request", req.id, None, {"status": req.status})
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/manager-reject", response_model=ExternalRequestOut)
def manager_reject(request_id: str, payload: ExternalRequestDecisionIn, db: DBSession, current_user: User = Depends(require_roles("manager", "admin"))):
    req = db.get(ExternalCourseRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    requester = db.get(User, req.requester_id)
    if current_user.role == "manager" and requester and requester.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot reject requests outside your team")
    req.status = "rejected_by_manager"
    req.manager_comment = payload.comment
    step = db.scalar(select(ApprovalStep).where(ApprovalStep.request_id == req.id, ApprovalStep.step_type == "manager"))
    if step:
        step.decision = "rejected"
        step.comment = payload.comment
        step.acted_at = datetime.now(timezone.utc)
    push_notification(db, req.requester_id, "approval", "Заявка отклонена руководителем", req.title, "external_request", req.id)
    write_audit(db, current_user.id, "manager_reject", "external_course_request", req.id, None, {"status": req.status})
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/hr-approve", response_model=ExternalRequestOut)
def hr_approve(request_id: str, payload: ExternalRequestDecisionIn, db: DBSession, current_user: User = Depends(require_roles("hr", "admin"))):
    req = db.get(ExternalCourseRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending_hr_approval":
        raise HTTPException(status_code=400, detail="Request is not waiting for HR / L&D approval")
    req.status = "approved"
    req.hr_comment = payload.comment
    external_course = Course(
        title=req.title,
        slug=f"external-{str(req.id)[:8]}",
        description=req.program_description,
        course_type="external",
        provider_name=req.provider_name,
        provider_url=req.provider_url,
        price_amount=req.cost_amount,
        price_currency=req.cost_currency,
        requires_approval=True,
        status="published",
        has_certificate=True,
        created_by=current_user.id,
    )
    db.add(external_course)
    db.flush()
    req.approved_course_id = external_course.id
    step = db.scalar(select(ApprovalStep).where(ApprovalStep.request_id == req.id, ApprovalStep.step_type == "hr"))
    if step:
        step.decision = "approved"
        step.comment = payload.comment
        step.acted_at = datetime.now(timezone.utc)
    enrollment = Enrollment(user_id=req.requester_id, course_id=external_course.id, status="in_progress", source="external_approved")
    db.add(enrollment)

    event = create_internal_calendar_event_for_request(db, req, title_suffix="Согласовано")
    sync_calendar_event(db, event)

    push_notification(db, req.requester_id, "approval", "Внешний курс согласован", req.title, "external_request", req.id)
    push_notification(db, req.requester_id, "calendar", "Курс добавлен в календарь", req.title, "calendar_event", event.id)
    write_audit(
        db,
        current_user.id,
        "hr_approve",
        "external_course_request",
        req.id,
        None,
        {"status": req.status, "course_id": str(external_course.id), "calendar_event_id": str(event.id)},
    )
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/hr-reject", response_model=ExternalRequestOut)
def hr_reject(request_id: str, payload: ExternalRequestDecisionIn, db: DBSession, current_user: User = Depends(require_roles("hr", "admin"))):
    req = db.get(ExternalCourseRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "rejected_by_hr"
    req.hr_comment = payload.comment
    step = db.scalar(select(ApprovalStep).where(ApprovalStep.request_id == req.id, ApprovalStep.step_type == "hr"))
    if step:
        step.decision = "rejected"
        step.comment = payload.comment
        step.acted_at = datetime.now(timezone.utc)
    push_notification(db, req.requester_id, "approval", "Заявка отклонена HR / L&D", req.title, "external_request", req.id)
    write_audit(db, current_user.id, "hr_reject", "external_course_request", req.id, None, {"status": req.status})
    db.commit()
    db.refresh(req)
    return req
