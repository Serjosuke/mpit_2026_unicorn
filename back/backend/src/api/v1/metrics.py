from datetime import datetime, timedelta, timezone
from io import BytesIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy import func, select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.certificate import Certificate
from src.models.course import Course
from src.models.course_lesson import CourseLesson
from src.models.course_module import CourseModule
from src.models.department import Department
from src.models.enrollment import Enrollment
from src.models.external_course_request import ExternalCourseRequest
from src.models.lesson_progress import LessonProgress
from src.models.review import Review
from src.models.user import User
from src.schemas.metrics import HRDashboardMetricsOut

router = APIRouter()


def _role_scope_clause(current_user: User):
    if current_user.role == "manager":
        return User.manager_id == current_user.id
    return True


def _build_rows(db: DBSession, current_user: User, department_id: str | None = None):
    users_stmt = select(User).where(User.role == "employee", User.is_active == True)
    if current_user.role == "manager":
        users_stmt = users_stmt.where(User.manager_id == current_user.id)
    if department_id:
        users_stmt = users_stmt.where(User.department_id == department_id)
    employees = list(db.scalars(users_stmt.order_by(User.last_name, User.first_name)).all())
    rows = []
    for employee in employees:
        dep = db.get(Department, employee.department_id) if employee.department_id else None
        enrollments = list(db.scalars(select(Enrollment).where(Enrollment.user_id == employee.id)).all())
        active = [e for e in enrollments if e.status in ["enrolled", "in_progress"]]
        completed = [e for e in enrollments if e.status == "completed"]
        current_enrollment = active[0] if active else (completed[0] if completed else None)
        course = db.get(Course, current_enrollment.course_id) if current_enrollment else None
        lesson_count = 0
        done_count = 0
        if current_enrollment and course:
            lesson_ids = db.scalars(select(CourseLesson.id).join(CourseModule, CourseLesson.module_id == CourseModule.id).where(CourseModule.course_id == course.id)).all()
            lesson_count = len(lesson_ids)
            if lesson_ids:
                done_count = len(db.scalars(select(LessonProgress).where(LessonProgress.enrollment_id == current_enrollment.id, LessonProgress.lesson_id.in_(lesson_ids), LessonProgress.is_completed == True)).all())
        progress = float(current_enrollment.progress_percent) if current_enrollment else 0
        last_activity_at = current_enrollment.updated_at if current_enrollment else employee.created_at
        age_days = (datetime.now(timezone.utc) - last_activity_at).days if last_activity_at else 999
        if age_days == 0:
            activity_label = "Сегодня"
        elif age_days <= 7:
            activity_label = "На этой неделе"
        elif age_days <= 30:
            activity_label = "Больше недели назад"
        else:
            activity_label = "Больше месяца назад"
        planned = (current_enrollment.started_at or current_enrollment.created_at) + timedelta(days=max(30, lesson_count * 5)) if current_enrollment else None
        sprint_lag = 0
        if current_enrollment and lesson_count:
            expected_ratio = min(((datetime.now(timezone.utc) - (current_enrollment.started_at or current_enrollment.created_at)).days / max(30, lesson_count * 5)), 1)
            expected_done = int(expected_ratio * lesson_count)
            sprint_lag = max((expected_done - done_count + 1) // 2, 0)
        if not current_enrollment or progress == 0:
            status = "Не начинал учёбу"
            status_group = "not_started"
        elif current_enrollment.status == "completed":
            status = "Обучение завершено"
            status_group = "completed"
        elif sprint_lag >= 3:
            status = "Отстаёт на 3+ спринта"
            status_group = "critical"
        elif sprint_lag >= 1:
            status = "Отстаёт на 1–2 спринта"
            status_group = "warning"
        else:
            status = "Успевает"
            status_group = "ok"
        rows.append({
            "user_id": str(employee.id),
            "employee_name": " ".join(x for x in [employee.last_name, employee.first_name, employee.middle_name] if x),
            "department_name": dep.name if dep else "Без отдела",
            "team_name": employee.team_name or "Без команды",
            "position_title": employee.position_title or employee.role,
            "manager_id": str(employee.manager_id) if employee.manager_id else None,
            "course_title": course.title if course else "—",
            "progress_percent": round(progress, 2),
            "last_activity": activity_label,
            "last_activity_at": last_activity_at.isoformat() if last_activity_at else None,
            "planned_completion": planned.date().isoformat() if planned else None,
            "sprint_lag": sprint_lag,
            "status": status,
            "status_group": status_group,
            "completed_courses": len(completed),
            "started_courses": len(enrollments),
            "active_courses": len(active),
        })
    return rows


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


@router.get("/monitor")
def monitor_metrics(db: DBSession, current_user: User = Depends(require_roles("admin", "hr", "manager")), department_id: str | None = Query(default=None)):
    rows = _build_rows(db, current_user, department_id=department_id)
    summary = {
        "critical": len([r for r in rows if r["status_group"] == "critical"]),
        "warning": len([r for r in rows if r["status_group"] == "warning"]),
        "ok": len([r for r in rows if r["status_group"] == "ok"]),
        "completed": len([r for r in rows if r["status_group"] == "completed"]),
        "not_started": len([r for r in rows if r["status_group"] == "not_started"]),
    }
    department_cards = []
    departments = list(db.scalars(select(Department).order_by(Department.name)).all())
    for dep in departments:
        dep_rows = [r for r in rows if r["department_name"] == dep.name]
        if dep_rows:
            department_cards.append({"id": str(dep.id), "name": dep.name, "employees": len(dep_rows), "teams": len(set(r["team_name"] for r in dep_rows))})
    team_cards = []
    for team in sorted(set(r["team_name"] for r in rows)):
        team_rows = [r for r in rows if r["team_name"] == team]
        team_cards.append({"team_name": team, "employees": len(team_rows), "departments": sorted(set(r["department_name"] for r in team_rows))})
    return {"summary": summary, "departments": department_cards, "teams": team_cards, "rows": rows}


@router.get("/monitor-export")
def monitor_export(db: DBSession, current_user: User = Depends(require_roles("admin", "hr", "manager")), department_id: str | None = Query(default=None)):
    rows = _build_rows(db, current_user, department_id=department_id)
    wb = Workbook()
    ws = wb.active
    ws.title = "Статистика сотрудников"
    headers = ["Сотрудник", "Отдел", "Команда", "Роль в команде", "Курс", "Прогресс %", "Последняя активность", "Плановое завершение", "Отставание (спринты)", "Статус", "Пройдено курсов", "Начато курсов"]
    ws.append(headers)
    for row in rows:
        ws.append([row["employee_name"], row["department_name"], row["team_name"], row["position_title"], row["course_title"], row["progress_percent"], row["last_activity"], row["planned_completion"], row["sprint_lag"], row["status"], row["completed_courses"], row["started_courses"]])
    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": 'attachment; filename="alrosa-monitor.xlsx"'})


@router.get("/home")
def home_metrics(db: DBSession, current_user: User = Depends(get_current_user)):
    enrollments = list(db.scalars(select(Enrollment).where(Enrollment.user_id == current_user.id).order_by(Enrollment.updated_at.desc())).all())
    certificates = list(db.scalars(select(Certificate).where(Certificate.user_id == current_user.id)).all())
    active = [e for e in enrollments if e.status in ["enrolled", "in_progress"]]
    urgent = None
    for e in active:
        course = db.get(Course, e.course_id)
        lesson_ids = list(db.scalars(select(CourseLesson.id).join(CourseModule, CourseLesson.module_id == CourseModule.id).where(CourseModule.course_id == e.course_id)).all())
        progress_map = {r.lesson_id: r for r in db.scalars(select(LessonProgress).where(LessonProgress.enrollment_id == e.id)).all()}
        modules = list(db.scalars(select(CourseModule).where(CourseModule.course_id == e.course_id).order_by(CourseModule.order_index)).all())
        base_date = e.started_at or e.created_at
        for module_index, module in enumerate(modules):
            lessons = list(db.scalars(select(CourseLesson).where(CourseLesson.module_id == module.id).order_by(CourseLesson.order_index)).all())
            for lesson in lessons:
                pr = progress_map.get(lesson.id)
                if pr and pr.is_completed:
                    continue
                due_at = base_date + timedelta(days=(module_index * 7) + lesson.order_index * 2)
                status = 'danger' if due_at < datetime.now(timezone.utc) else ('warning' if due_at - datetime.now(timezone.utc) <= timedelta(hours=24) else 'normal')
                candidate = {
                    'course_title': course.title if course else '—',
                    'lesson_title': lesson.title,
                    'due_at': due_at.isoformat(),
                    'deadline_status': status,
                    'enrollment_id': str(e.id),
                    'course_id': str(e.course_id),
                }
                if urgent is None or due_at < datetime.fromisoformat(urgent['due_at']):
                    urgent = candidate
    return {
        'active_courses': len(active),
        'completed_courses': len([e for e in enrollments if e.status == 'completed']),
        'certificates': len(certificates),
        'urgent_lesson': urgent,
    }
