from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from src.api.deps import require_roles
from src.db.deps import DBSession
from src.models.certificate import Certificate
from src.models.course import Course
from src.models.enrollment import Enrollment
from src.models.external_course_request import ExternalCourseRequest
from src.models.review import Review
from src.models.user import User
from src.schemas.metrics import HRDashboardMetricsOut

router = APIRouter()


@router.get("/hr-dashboard", response_model=HRDashboardMetricsOut)
def hr_dashboard_metrics(db: DBSession, _: User = Depends(require_roles("admin", "hr"))):
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    total_employees = db.scalar(select(func.count()).select_from(User).where(User.role == "employee")) or 0
    total_trainers = db.scalar(select(func.count()).select_from(User).where(User.role == "trainer")) or 0
    total_courses = db.scalar(select(func.count()).select_from(Course)) or 0
    published_courses = db.scalar(select(func.count()).select_from(Course).where(Course.status == "published")) or 0
    total_enrollments = db.scalar(select(func.count()).select_from(Enrollment)) or 0
    completed_enrollments = db.scalar(select(func.count()).select_from(Enrollment).where(Enrollment.status == "completed")) or 0
    active_enrollments = db.scalar(select(func.count()).select_from(Enrollment).where(Enrollment.status.in_(["enrolled", "in_progress"]))) or 0
    completion_rate_percent = round((completed_enrollments / total_enrollments) * 100, 2) if total_enrollments else 0.0
    external_requests_total = db.scalar(select(func.count()).select_from(ExternalCourseRequest)) or 0
    external_requests_pending_manager = db.scalar(select(func.count()).select_from(ExternalCourseRequest).where(ExternalCourseRequest.status == "pending_manager_approval")) or 0
    external_requests_pending_hr = db.scalar(select(func.count()).select_from(ExternalCourseRequest).where(ExternalCourseRequest.status == "pending_hr_approval")) or 0
    external_requests_approved = db.scalar(select(func.count()).select_from(ExternalCourseRequest).where(ExternalCourseRequest.status == "approved")) or 0
    external_requests_rejected = db.scalar(select(func.count()).select_from(ExternalCourseRequest).where(ExternalCourseRequest.status.in_(["rejected_by_manager", "rejected_by_hr"]))) or 0
    certificates_total = db.scalar(select(func.count()).select_from(Certificate)) or 0
    reviews_total = db.scalar(select(func.count()).select_from(Review)) or 0
    average_review_rating = db.scalar(select(func.avg(Review.rating)).select_from(Review)) or 0
    average_review_rating = round(float(average_review_rating), 2)

    return HRDashboardMetricsOut(
        total_users=total_users,
        total_employees=total_employees,
        total_trainers=total_trainers,
        total_courses=total_courses,
        published_courses=published_courses,
        total_enrollments=total_enrollments,
        completed_enrollments=completed_enrollments,
        active_enrollments=active_enrollments,
        completion_rate_percent=completion_rate_percent,
        external_requests_total=external_requests_total,
        external_requests_pending_manager=external_requests_pending_manager,
        external_requests_pending_hr=external_requests_pending_hr,
        external_requests_approved=external_requests_approved,
        external_requests_rejected=external_requests_rejected,
        certificates_total=certificates_total,
        reviews_total=reviews_total,
        average_review_rating=average_review_rating,
    )
