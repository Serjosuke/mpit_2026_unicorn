export type UUID = string;

export type UserRole = "admin" | "hr" | "manager" | "employee" | "trainer";

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  role: UserRole;
  department_id?: UUID | null;
  manager_id?: UUID | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Course {
  id: UUID;
  title: string;
  slug: string;
  description?: string | null;
  course_type: "internal" | "external" | string;
  status: string;
  category_id?: UUID | null;
  created_at: string;
}

export interface Enrollment {
  id: UUID;
  user_id: UUID;
  course_id: UUID;
  status: string;
  progress_percent: number;
  source: string;
  created_at: string;
}

export interface ExternalRequest {
  id: UUID;
  requester_id: UUID;
  title: string;
  provider_name: string;
  status: string;
  cost_amount: number;
  cost_currency: string;
  created_at: string;
}

export interface Certificate {
  id: UUID;
  user_id: UUID;
  source: string;
  status: string;
  issue_date?: string | null;
  created_at: string;
}

export interface Notification {
  id: UUID;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: UUID;
  course_id: UUID;
  enrollment_id: UUID;
  rating: number;
  comment?: string | null;
  created_at: string;
}


export interface CalendarEvent {
  id: UUID;
  user_id: UUID;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  source: string;
  sync_provider: string;
  sync_status: string;
  course_id?: UUID | null;
  external_request_id?: UUID | null;
  meeting_url?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HRDashboardMetrics {
  total_users: number;
  total_employees: number;
  total_trainers: number;
  total_courses: number;
  published_courses: number;
  total_enrollments: number;
  completed_enrollments: number;
  active_enrollments: number;
  completion_rate_percent: number;
  external_requests_total: number;
  external_requests_pending_manager: number;
  external_requests_pending_hr: number;
  external_requests_approved: number;
  external_requests_rejected: number;
  certificates_total: number;
  reviews_total: number;
  average_review_rating: number;
}


export interface OutlookStatus {
  connected: boolean;
  configured: boolean;
  outlook_email?: string | null;
  expires_at?: string | null;
  scopes: string[];
}
