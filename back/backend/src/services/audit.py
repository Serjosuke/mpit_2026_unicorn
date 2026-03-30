from sqlalchemy.orm import Session

from src.models.audit_log import AuditLog


def write_audit(db: Session, actor_user_id, action: str, entity_type: str, entity_id=None, old_values=None, new_values=None):
    db.add(
        AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
        )
    )
