from datetime import date
from sqlalchemy.orm import Session

from src.models.certificate import Certificate


def create_internal_certificate(db: Session, user_id, course_id, enrollment_id):
    cert = Certificate(
        user_id=user_id,
        course_id=course_id,
        enrollment_id=enrollment_id,
        issue_date=date.today(),
        issuer_name="ALROSA Corporate University",
        source="internal",
        status="valid",
    )
    db.add(cert)
    return cert
