from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    hr = "hr"
    manager = "manager"
    employee = "employee"
    trainer = "trainer"


class CourseType(str, Enum):
    internal = "internal"
    external = "external"


class CourseStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class EnrollmentStatus(str, Enum):
    enrolled = "enrolled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    blocked = "blocked"


class EnrollmentSource(str, Enum):
    self = "self"
    assigned = "assigned"
    external_approved = "external_approved"


class ExternalRequestStatus(str, Enum):
    draft = "draft"
    pending_manager_approval = "pending_manager_approval"
    rejected_by_manager = "rejected_by_manager"
    pending_hr_approval = "pending_hr_approval"
    rejected_by_hr = "rejected_by_hr"
    approved = "approved"
    cancelled = "cancelled"
    completed = "completed"


class ApprovalStepType(str, Enum):
    manager = "manager"
    hr = "hr"


class ApprovalDecision(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
