"use client";

import { clearToken, getToken } from "@/lib/storage";
import type {
  Certificate,
  Course,
  Enrollment,
  ExternalRequest,
  Notification,
  Review,
  Token,
  User,
  CalendarEvent,
  HRDashboardMetrics,
  OutlookStatus
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE_URL}/api/v1`;

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    let detail = "Неизвестная ошибка";
    try {
      const payload = await response.json();
      detail =
        payload?.detail
          ? Array.isArray(payload.detail)
            ? payload.detail.map((item: any) => item.msg || item.detail || JSON.stringify(item)).join(", ")
            : String(payload.detail)
          : detail;
    } catch {
      // ignore
    }

    if (response.status === 401) {
      clearToken();
    }

    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
  }) => request<User>("/auth/register", { method: "POST", body: JSON.stringify(payload) }, false),

  login: (payload: { email: string; password: string }) =>
    request<Token>("/auth/login", { method: "POST", body: JSON.stringify(payload) }, false),

  me: () => request<User>("/auth/me"),

  listCourses: () => request<Course[]>("/courses/"),
  getCourse: (courseId: string) => request<Course>(`/courses/${courseId}`),

  enroll: (course_id: string) =>
    request<Enrollment>("/enrollments/", { method: "POST", body: JSON.stringify({ course_id }) }),

  myEnrollments: () => request<Enrollment[]>("/enrollments/mine"),
  completeEnrollment: (enrollmentId: string) =>
    request<Enrollment>(`/enrollments/${enrollmentId}/complete`, { method: "POST" }),

  myExternalRequests: () => request<ExternalRequest[]>("/external-requests/mine"),
  pendingExternalRequests: () => request<ExternalRequest[]>("/external-requests/pending"),
  createExternalRequest: (payload: {
    title: string;
    provider_name: string;
    provider_url?: string;
    program_description?: string;
    justification: string;
    cost_amount: number;
    cost_currency?: string;
    requested_start_date?: string;
    requested_end_date?: string;
    estimated_duration_hours?: number;
    budget_code?: string;
  }) => request<ExternalRequest>("/external-requests/", { method: "POST", body: JSON.stringify(payload) }),
  managerApprove: (id: string, comment?: string) =>
    request<ExternalRequest>(`/external-requests/${id}/manager-approve`, {
      method: "POST",
      body: JSON.stringify({ comment })
    }),
  managerReject: (id: string, comment?: string) =>
    request<ExternalRequest>(`/external-requests/${id}/manager-reject`, {
      method: "POST",
      body: JSON.stringify({ comment })
    }),
  hrApprove: (id: string, comment?: string) =>
    request<ExternalRequest>(`/external-requests/${id}/hr-approve`, {
      method: "POST",
      body: JSON.stringify({ comment })
    }),
  hrReject: (id: string, comment?: string) =>
    request<ExternalRequest>(`/external-requests/${id}/hr-reject`, {
      method: "POST",
      body: JSON.stringify({ comment })
    }),

  myCertificates: () => request<Certificate[]>("/certificates/mine"),
  createCertificate: (payload: {
    course_id?: string | null;
    enrollment_id?: string | null;
    external_request_id?: string | null;
    certificate_number?: string | null;
    issue_date?: string | null;
    issuer_name?: string | null;
    file_id?: string | null;
    verification_url?: string | null;
    source: string;
  }) => request<Certificate>("/certificates/", { method: "POST", body: JSON.stringify(payload) }),

  myNotifications: () => request<Notification[]>("/notifications/mine"),
  markNotificationRead: (id: string) => request<Notification>(`/notifications/${id}/read`, { method: "POST" }),

  myCalendarEvents: () => request<CalendarEvent[]>("/calendar/mine"),
  userCalendarEvents: (userId: string) => request<CalendarEvent[]>(`/calendar/user/${userId}`),

  outlookStatus: () => request<OutlookStatus>("/calendar/outlook/status"),
  outlookConnectUrl: () => request<{ authorize_url: string }>("/calendar/outlook/connect-url"),
  outlookDisconnect: () => request<{ ok: boolean }>("/calendar/outlook/disconnect", { method: "POST" }),
  hrDashboardMetrics: () => request<HRDashboardMetrics>("/metrics/hr-dashboard"),

  createReview: (payload: { course_id: string; enrollment_id: string; rating: number; comment?: string }) =>
    request<Review>("/reviews/", { method: "POST", body: JSON.stringify(payload) }),
  courseReviews: (courseId: string) => request<Review[]>(`/reviews/course/${courseId}`)
};
