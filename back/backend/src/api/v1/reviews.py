from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from src.api.deps import get_current_user
from src.db.deps import DBSession
from src.models.enrollment import Enrollment
from src.models.review import Review
from src.models.user import User
from src.schemas.review import ReviewCreate, ReviewOut
from src.services.audit import write_audit

router = APIRouter()


@router.post("/", response_model=ReviewOut)
def create_review(payload: ReviewCreate, db: DBSession, current_user: User = Depends(get_current_user)):
    enrollment = db.get(Enrollment, payload.enrollment_id)
    if not enrollment or enrollment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Enrollment not found for current user")
    if enrollment.status != "completed":
        raise HTTPException(status_code=400, detail="You can review only completed courses")
    review = Review(user_id=current_user.id, **payload.model_dump())
    db.add(review)
    write_audit(db, current_user.id, "create", "review", review.id, None, {"rating": review.rating})
    db.commit()
    db.refresh(review)
    return review


@router.get("/course/{course_id}", response_model=list[ReviewOut])
def list_course_reviews(course_id: str, db: DBSession, _: User = Depends(get_current_user)):
    return list(db.scalars(select(Review).where(Review.course_id == course_id).order_by(Review.created_at.desc())).all())
