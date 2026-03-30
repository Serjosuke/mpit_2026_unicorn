from sqlalchemy.orm import Session

from src.models.notification import Notification


def push_notification(db: Session, user_id, ntype: str, title: str, body: str, related_entity_type=None, related_entity_id=None):
    db.add(Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        body=body,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    ))
