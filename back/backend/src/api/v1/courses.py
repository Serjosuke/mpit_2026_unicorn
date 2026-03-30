from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from src.api.deps import get_current_user, require_roles
from src.db.deps import DBSession
from src.models.course import Course
from src.models.user import User
from src.schemas.course import CourseCreate, CourseOut
from src.services.audit import write_audit

router = APIRouter()


@router.get("/", response_model=list[CourseOut])
def list_courses(db: DBSession, current_user: User = Depends(get_current_user)):
    stmt = select(Course).order_by(Course.created_at.desc())
    if current_user.role == "employee":
        stmt = stmt.where(Course.status == "published")
    return list(db.scalars(stmt).all())


@router.post("/", response_model=CourseOut)
def create_course(payload: CourseCreate, db: DBSession, current_user: User = Depends(require_roles("admin", "hr", "trainer"))):
    exists = db.scalar(select(Course).where(Course.slug == payload.slug))
    if exists:
        raise HTTPException(status_code=400, detail="Slug already exists")
    course = Course(**payload.model_dump(), created_by=current_user.id)
    db.add(course)
    write_audit(db, current_user.id, "create", "course", course.id, None, {"title": course.title, "slug": course.slug})
    db.commit()
    db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == "employee" and course.status != "published":
        raise HTTPException(status_code=403, detail="Forbidden")
    return course
