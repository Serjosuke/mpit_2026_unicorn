from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.approval_step import ApprovalStep
from src.models.course import Course
from src.models.enrollment import Enrollment
from src.models.external_course_request import ExternalCourseRequest
from src.models.user import User
from src.schemas.external_request import ExternalRequestCreate, ExternalRequestDecisionIn, ExternalRequestOut
from src.services.audit import write_audit
from src.services.notifications import push_notification

router = APIRouter()


@router.get("/mine", response_model=list[ExternalRequestOut])
def my_requests(db: DBSession, current_user: User = Depends(get_current_user)):
    return list(db.scalars(select(ExternalCourseRequest).where(ExternalCourseRequest.requester_id == current_user.id).order_by(ExternalCourseRequest.created_at.desc())).all())


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
    db.commit()
    db.refresh(request)
    write_audit(db, current_user.id, "create", "external_course_request", request.id, None, {"status": request.status})
    return request


@router.get("/pending", response_model=list[ExternalRequestOut])
def pending_requests(db: DBSession, current_user: User = Depends(require_roles("admin", "hr", "manager"))):
    stmt = select(ExternalCourseRequest)
    if current_user.role == "manager":
        stmt = stmt.where(ExternalCourseRequest.status == "pending_manager_approval")
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
    req.status = "pending_hr_approval"
    req.manager_comment = payload.comment
    step = db.scalar(select(ApprovalStep).where(ApprovalStep.request_id == req.id, ApprovalStep.step_type == "manager"))
    if step:
        step.decision = "approved"
        step.comment = payload.comment
        step.acted_at = datetime.now(timezone.utc)
    db.add(ApprovalStep(request_id=req.id, step_type="hr", approver_id=current_user.id, order_index=2))
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
        raise HTTPException(status_code=400, detail="Request is not waiting for HR approval")
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
    push_notification(db, req.requester_id, "approval", "Внешний курс согласован", req.title, "external_request", req.id)
    write_audit(db, current_user.id, "hr_approve", "external_course_request", req.id, None, {"status": req.status, "course_id": str(external_course.id)})
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
    push_notification(db, req.requester_id, "approval", "Внешний курс отклонён HR", req.title, "external_request", req.id)
    write_audit(db, current_user.id, "hr_reject", "external_course_request", req.id, None, {"status": req.status})
    db.commit()
    db.refresh(req)
    return req
