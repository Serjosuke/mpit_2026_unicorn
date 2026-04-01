export type UUID = string;

export type UserRole = "admin" | "hr" | "manager" | "employee" | "trainer";

export interface Token { access_token: string; token_type: string; }

export interface User {
  id: UUID; email: string; first_name: string; last_name: string; middle_name?: string | null;
  role: UserRole; department_id?: UUID | null; manager_id?: UUID | null; position_title?: string | null; team_name?: string | null;
  is_active: boolean; is_verified: boolean; created_at: string;
}

export interface Department { id: UUID; name: string; code?: string | null; parent_id?: UUID | null; }
export interface Course {
  id: UUID; title: string; slug: string; description?: string | null; summary?: string | null; skill_tags?: string | null;
  level?: string | null; delivery_mode?: string | null; source_priority?: number; is_featured_internal?: boolean;
  course_type: string; status: string; category_id?: UUID | null; provider_name?: string | null; provider_url?: string | null;
  duration_hours?: number | null; created_at: string; created_by?: UUID | null;
  total_enrollments_count?: number; active_enrollments_count?: number; completed_enrollments_count?: number; session_days?: string[];
}
<<<<<<< HEAD
export interface Enrollment { id: UUID; user_id: UUID; course_id: UUID; status: string; progress_percent: number; source?: string | null; created_at: string; updated_at?: string | null; started_at?: string | null; completed_at?: string | null; target_completion_date?: string | null; }
=======
export interface Enrollment { id: UUID; user_id: UUID; course_id: UUID; status: string; progress_percent: number; source: string; created_at: string; }
>>>>>>> d839566c6f869da06a6c368782231753931b1123
export interface ExternalRequest { id: UUID; requester_id: UUID; title: string; provider_name: string; provider_url?: string | null; program_description?: string | null; justification: string; status: string; cost_amount: number; cost_currency: string; requested_start_date?: string | null; requested_end_date?: string | null; estimated_duration_hours?: number | null; budget_code?: string | null; manager_comment?: string | null; hr_comment?: string | null; requester_name?: string | null; requester_email?: string | null; requester_department_name?: string | null; requester_team_name?: string | null; created_at: string; }
export interface Certificate { id: UUID; user_id: UUID; source: string; status: string; issue_date?: string | null; created_at: string; issuer_name?: string | null; certificate_number?: string | null; file_id?: string | null; file_name?: string | null; file_url?: string | null; }
export interface Notification { id: UUID; type: string; title: string; body: string; is_read: boolean; created_at: string; }
export interface Review { id: UUID; course_id: UUID; enrollment_id: UUID; rating: number; comment?: string | null; created_at: string; }
export interface CalendarEvent {
  id: UUID; user_id: UUID; title: string; description?: string | null; starts_at?: string | null; ends_at?: string | null; source: string; sync_provider: string; sync_status: string; course_id?: UUID | null; external_request_id?: UUID | null; meeting_url?: string | null; location?: string | null; priority?: number; event_kind?: string; is_reminder_only?: boolean; created_at: string; updated_at: string;
}
export interface SmartCourseResult {
  source_type: string; title: string; provider_name: string; provider_url?: string | null; summary?: string | null; description?: string | null;
  level?: string | null; delivery_mode?: string | null; duration_hours?: number | null; price_amount?: number | null; price_currency?: string | null;
  freshness_label?: string | null; difficulty?: string | null; average_rating?: number | null; ai_rating?: number | null; ai_review?: string | null; score: number; why_recommended: string; course_id?: UUID | null; is_internal_priority: boolean; is_recommended?: boolean; tags: string[];
}
export interface SmartSearchPayload { query: string; normalized_query: Record<string, unknown>; results: SmartCourseResult[]; }
export interface HRExternalAssignPayload {
  employee_id: UUID; title: string; provider_name: string; provider_url: string; summary?: string; description?: string; level?: string; delivery_mode?: string; duration_hours?: number; due_date: string; price_amount?: number; price_currency?: string; source_priority?: number;
}
export interface HRExternalAssignResult { course: Course; enrollment_id: UUID; calendar_event_id: UUID; conflict_handled_as_reminder: boolean; conflict_reason?: string | null; }
export interface HRDashboardMetrics { total_users: number; total_employees: number; total_trainers: number; total_courses: number; published_courses: number; total_enrollments: number; completed_enrollments: number; active_enrollments: number; completion_rate_percent: number; external_requests_total: number; external_requests_pending_manager: number; external_requests_pending_hr: number; external_requests_approved: number; external_requests_rejected: number; certificates_total: number; reviews_total: number; average_review_rating: number; }
export interface ManagerCourseLessonInput { title: string; content?: string | null; estimated_minutes?: number | null; }
export interface ManagerCourseModuleInput { title: string; description?: string | null; lessons: ManagerCourseLessonInput[]; }
export interface ManagerCourseSessionInput { title: string; starts_at: string; ends_at: string; location?: string | null; meeting_url?: string | null; }
export interface ManagerCourseDraftInput { title: string; summary?: string | null; description?: string | null; skill_tags?: string | null; level?: string | null; delivery_mode: string; duration_hours?: number | null; provider_name?: string | null; modules: ManagerCourseModuleInput[]; sessions: ManagerCourseSessionInput[]; }
export interface MonitorRow { user_id: UUID; employee_name: string; department_name: string; team_name: string; position_title: string; course_title: string; progress_percent: number; last_activity: string; planned_completion?: string | null; sprint_lag: number; status: string; status_group: string; completed_courses: number; started_courses: number; active_courses: number; }
export interface MonitorCard { id?: UUID; name?: string; team_name?: string; employees: number; teams?: number; departments?: string[]; }
export interface MonitorPayload { summary: { critical: number; warning: number; ok: number; completed: number; not_started: number; }; departments: MonitorCard[]; teams: MonitorCard[]; rows: MonitorRow[]; }
export interface LessonTrack { id: UUID; title: string; order_index: number; lesson_type: string; content?: string | null; estimated_minutes?: number | null; is_completed: boolean; completed_at?: string | null; due_at?: string | null; deadline_status: string; }
export interface ModuleTrack { id: UUID; title: string; description?: string | null; order_index: number; lessons: LessonTrack[]; }
export interface CourseTrack { course: Course; enrollment_id?: UUID | null; progress_percent: number; active_lessons: number; completed_lessons: number; overdue_lessons: number; modules: ModuleTrack[]; }
export interface OutlookStatus { connected: boolean; configured: boolean; outlook_email?: string | null; expires_at?: string | null; scopes: string[]; }
export interface HomeMetrics { active_courses: number; completed_courses: number; certificates: number; urgent_lesson?: { course_title: string; lesson_title: string; due_at: string; deadline_status: string; enrollment_id: string; course_id: string; } | null; }
export interface UserProfileSummary {
  user: { id: UUID; full_name: string; email: string; role: string; department_name?: string | null; team_name?: string | null; position_title?: string | null; };
  stats: { active_courses: number; completed_courses: number; certificates: number; last_activity_at?: string | null; };
  courses: Array<{ enrollment_id: UUID; course_id: UUID; course_title: string; status: string; progress_percent: number; updated_at?: string | null; deadline_at?: string | null; course_type?: string | null; priority_score?: number; }>;
  certificates: Array<{ id: UUID; issuer_name?: string | null; issue_date?: string | null; status: string; source: string; file_id?: UUID | null; }>;
}
