from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.enums import UserRole
from src.core.security import hash_password
from src.core.config import settings
from src.models.course import Course
from src.models.course_category import CourseCategory
from src.models.course_lesson import CourseLesson
from src.models.course_module import CourseModule
from src.models.course_session import CourseSession
from src.models.department import Department
from src.models.enrollment import Enrollment
from src.models.lesson_progress import LessonProgress
from src.models.user import User

DEFAULT_CATEGORIES = [
    ("Корпоративные программы", "corporate-programs"),
    ("Личная эффективность", "personal-effectiveness"),
    ("Управленческая эффективность", "managerial-effectiveness"),
    ("Коммуникативная эффективность", "communicative-effectiveness"),
    ("Корпоративная эффективность", "corporate-effectiveness"),
    ("Цифровая эффективность", "digital-effectiveness"),
]


def _get_or_create_user(db: Session, **kwargs) -> User:
    user = db.scalar(select(User).where(User.email == kwargs["email"]))
    if user:
        return user
    user = User(password_hash=hash_password(kwargs.pop("password")), is_active=True, is_verified=True, **kwargs)
    db.add(user)
    db.flush()
    return user


def seed_initial_data(db: Session) -> None:
    admin = db.scalar(select(User).where(User.email == settings.first_superuser_email))
    if not admin:
        admin = User(
            email=settings.first_superuser_email,
            password_hash=hash_password(settings.first_superuser_password),
            first_name="System",
            last_name="Admin",
            role=UserRole.admin.value,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.flush()

    categories = {}
    for name, slug in DEFAULT_CATEGORIES:
        exists = db.scalar(select(CourseCategory).where(CourseCategory.slug == slug))
        if not exists:
            exists = CourseCategory(name=name, slug=slug)
            db.add(exists)
            db.flush()
        categories[slug] = exists

    dep_it = db.scalar(select(Department).where(Department.code == "IT"))
    if not dep_it:
        dep_it = Department(name="ИТ", code="IT")
        db.add(dep_it)
        db.flush()
    dep_hr = db.scalar(select(Department).where(Department.code == "HR"))
    if not dep_hr:
        dep_hr = Department(name="HR и развитие", code="HR")
        db.add(dep_hr)
        db.flush()

    hr = _get_or_create_user(db, email="hr@alrosa.com", password="Hr123456!", first_name="Ирина", last_name="Кузнецова", role="hr", department_id=dep_hr.id, position_title="HR / L&D менеджер", team_name="People Ops")
    trainer = _get_or_create_user(db, email="trainer@alrosa.com", password="Trainer123!", first_name="Павел", last_name="Тренеров", role="trainer", department_id=dep_hr.id, position_title="Внутренний тренер", team_name="Академия")
    manager = _get_or_create_user(db, email="manager@alrosa.com", password="Manager123!", first_name="Алексей", last_name="Иванов", role="manager", department_id=dep_it.id, position_title="Руководитель команды", team_name="Разработка")
    employee1 = _get_or_create_user(db, email="employee1@alrosa.com", password="Employee123!", first_name="Анна", last_name="Соколова", role="employee", department_id=dep_it.id, manager_id=manager.id, position_title="Frontend-разработчик", team_name="Разработка")
    employee2 = _get_or_create_user(db, email="employee2@alrosa.com", password="Employee123!", first_name="Илья", last_name="Сергеев", role="employee", department_id=dep_it.id, manager_id=manager.id, position_title="Backend-разработчик", team_name="Разработка")

    demo_courses = [
        {
            "slug": "effective-communication-101",
            "title": "Эффективная коммуникация в проектной команде",
            "description": "Внутренний курс в стиле треков Практикума: теория, задания, дедлайны и проверка понимания.",
            "summary": "Внутренний приоритетный soft skills курс для работы в команде.",
            "skill_tags": "soft skills, коммуникация, переговоры",
            "level": "all",
            "delivery_mode": "offline",
            "duration_hours": 12,
            "category_slug": "communicative-effectiveness",
        },
        {
            "slug": "productivity-digital-workflow",
            "title": "Цифровая продуктивность и управление задачами",
            "description": "Курс про рабочие ритуалы, контроль дедлайнов и прозрачность командного прогресса.",
            "summary": "Внутренний курс по цифровой эффективности и личной организации.",
            "skill_tags": "productivity, digital, planning",
            "level": "all",
            "delivery_mode": "online",
            "duration_hours": 10,
            "category_slug": "digital-effectiveness",
        },
        {
            "slug": "java-middle-alrosa-bootcamp",
            "title": "Java Middle Bootcamp ALROSA",
            "description": "Внутренний ускоренный курс для middle Java-разработчиков с приоритетом в расписании.",
            "summary": "Java middle, Spring, REST, code review и рабочие практики ALROSA.",
            "skill_tags": "java, backend, spring, middle",
            "level": "middle",
            "delivery_mode": "offline",
            "duration_hours": 20,
            "category_slug": "digital-effectiveness",
        },
    ]
    for course_data in demo_courses:
        course = db.scalar(select(Course).where(Course.slug == course_data["slug"]))
        if not course:
            course = Course(
                title=course_data["title"],
                slug=course_data["slug"],
                description=course_data["description"],
                summary=course_data["summary"],
                skill_tags=course_data["skill_tags"],
                level=course_data["level"],
                delivery_mode=course_data["delivery_mode"],
                source_priority=1,
                is_featured_internal=True,
                course_type="internal",
                category_id=categories[course_data["category_slug"]].id,
                trainer_id=trainer.id,
                created_by=hr.id,
                duration_hours=course_data["duration_hours"],
                has_certificate=True,
                status="published",
                provider_name="ALROSA Academy",
                provider_url="https://manager-cabinet.practicum.yandex.ru",
            )
            db.add(course)
            db.flush()
            for module_index in range(1, 3):
                module = CourseModule(course_id=course.id, title=f"Модуль {module_index}", description="Практический блок с короткими заданиями", order_index=module_index, content_type="lesson_set", estimated_minutes=90)
                db.add(module)
                db.flush()
                for lesson_index in range(1, 4):
                    db.add(CourseLesson(module_id=module.id, title=f"Задание {module_index}.{lesson_index}", order_index=lesson_index, lesson_type="assignment", content="Прочитай материал, ответь на контрольные вопросы и зафиксируй результат в системе.", estimated_minutes=25 + lesson_index * 5))
            if course_data["delivery_mode"] == "offline":
                now = datetime.now(timezone.utc)
                for idx in range(2):
                    session = CourseSession(
                        course_id=course.id,
                        title=f"Групповая сессия {idx + 1}",
                        starts_at=now + timedelta(days=idx + 2, hours=7),
                        ends_at=now + timedelta(days=idx + 2, hours=9),
                        location="Учебный класс ALROSA",
                    )
                    db.add(session)
        db.flush()

    internal_courses = list(db.scalars(select(Course).where(Course.course_type == "internal").order_by(Course.created_at)).all())[:2]
    for index, employee in enumerate([employee1, employee2]):
        for course in internal_courses:
            enrollment = db.scalar(select(Enrollment).where(Enrollment.user_id == employee.id, Enrollment.course_id == course.id))
            if not enrollment:
                started_at = datetime.now(timezone.utc) - timedelta(days=7 + index * 3)
                enrollment = Enrollment(user_id=employee.id, course_id=course.id, status="in_progress", progress_percent=33 + index * 20, source="seed", started_at=started_at)
                db.add(enrollment)
                db.flush()
                lesson_ids = list(db.scalars(select(CourseLesson.id).join(CourseModule, CourseLesson.module_id == CourseModule.id).where(CourseModule.course_id == course.id).order_by(CourseLesson.order_index)).all())
                for lesson_id in lesson_ids[: (2 + index)]:
                    db.add(LessonProgress(enrollment_id=enrollment.id, lesson_id=lesson_id, is_completed=True, completed_at=started_at + timedelta(days=1)))

    db.commit()


ROLE_PRESETS = ["Android-разработчик", "React-разработчик", "Java-разработчик", "Фронтенд-разработчик", "Бэкенд-разработчик", "DevOps-инженер", "Аналитик данных", "Продакт-менеджер", "Специалист по информационной безопасности"]
