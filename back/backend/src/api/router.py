from fastapi import APIRouter

from src.api.v1.auth import router as auth_router
from src.api.v1.users import router as users_router
from src.api.v1.departments import router as departments_router
from src.api.v1.courses import router as courses_router
from src.api.v1.enrollments import router as enrollments_router
from src.api.v1.external_requests import router as external_requests_router
from src.api.v1.certificates import router as certificates_router
from src.api.v1.reviews import router as reviews_router
from src.api.v1.notifications import router as notifications_router
from src.api.v1.audit import router as audit_router
from src.api.v1.calendar import router as calendar_router
from src.api.v1.metrics import router as metrics_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(departments_router, prefix="/departments", tags=["departments"])
api_router.include_router(courses_router, prefix="/courses", tags=["courses"])
api_router.include_router(enrollments_router, prefix="/enrollments", tags=["enrollments"])
api_router.include_router(external_requests_router, prefix="/external-requests", tags=["external-requests"])
api_router.include_router(certificates_router, prefix="/certificates", tags=["certificates"])
api_router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(audit_router, prefix="/audit", tags=["audit"])
api_router.include_router(calendar_router, prefix="/calendar", tags=["calendar"])
api_router.include_router(metrics_router, prefix="/metrics", tags=["metrics"])
