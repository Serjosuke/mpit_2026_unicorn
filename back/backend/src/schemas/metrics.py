from pydantic import BaseModel


class HRDashboardMetricsOut(BaseModel):
    total_users: int
    total_employees: int
    total_trainers: int
    total_courses: int
    published_courses: int
    total_enrollments: int
    completed_enrollments: int
    active_enrollments: int
    completion_rate_percent: float
    external_requests_total: int
    external_requests_pending_manager: int
    external_requests_pending_hr: int
    external_requests_approved: int
    external_requests_rejected: int
    certificates_total: int
    reviews_total: int
    average_review_rating: float