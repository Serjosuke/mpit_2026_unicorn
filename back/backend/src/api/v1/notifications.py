from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from src.api.deps import get_current_user
from src.db.deps import DBSession
from src.models.notification import Notification
from src.models.user import User
from src.schemas.notification import NotificationOut

router = APIRouter()


@router.get("/mine", response_model=list[NotificationOut])
def my_notifications(db: DBSession, current_user: User = Depends(get_current_user)):
    return list(db.scalars(select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())).all())


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: str, db: DBSession, current_user: User = Depends(get_current_user)):
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
