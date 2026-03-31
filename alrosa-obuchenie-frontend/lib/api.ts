"use client";

import { clearToken, getToken } from "@/lib/storage";
import type { Certificate, Course, Enrollment, ExternalRequest, Notification, Review, Token, User, CalendarEvent, HRDashboardMetrics, OutlookStatus, Department, MonitorPayload, CourseTrack, HomeMetrics, UserProfileSummary, SmartSearchPayload, HRExternalAssignPayload, HRExternalAssignResult } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_PREFIX = `${API_BASE_URL}/api/v1`;

export class ApiError extends Error { status: number; detail: string; constructor(status: number, detail: string) { super(detail); this.status = status; this.detail = detail; } }

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (auth) { const token = getToken(); if (token) headers.set("Authorization", `Bearer ${token}`); }
  const response = await fetch(`${API_PREFIX}${path}`, { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    let detail = "Неизвестная ошибка";
    try { const payload = await response.json(); detail = payload?.detail ? Array.isArray(payload.detail) ? payload.detail.map((i: any) => i.msg || i.detail || JSON.stringify(i)).join(", ") : String(payload.detail) : detail; } catch {}
    if (response.status === 401) clearToken();
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { email: string; password: string; first_name: string; last_name: string; middle_name?: string; }) => request<User>("/auth/register", { method: "POST", body: JSON.stringify(payload) }, false),
  login: (payload: { email: string; password: string }) => request<Token>("/auth/login", { method: "POST", body: JSON.stringify(payload) }, false),
  me: () => request<User>("/auth/me"),
  listCourses: () => request<Course[]>("/courses/"),
  smartSearchCourses: (q: string) => request<SmartSearchPayload>(`/courses/smart-search?q=${encodeURIComponent(q)}`),
  externalSearchCourses: (q: string) => request<SmartSearchPayload>(`/courses/external-search?q=${encodeURIComponent(q)}`),
  favoriteExternalCourse: (payload: Record<string, unknown>) => request<Course>("/courses/favorite-external", { method: "POST", body: JSON.stringify(payload) }),
  assignExternalCourse: (payload: HRExternalAssignPayload) => request<HRExternalAssignResult>("/courses/assign-external", { method: "POST", body: JSON.stringify(payload) }),
  assignExternalCourseBulk: (payload: Record<string, unknown>) => request<{ created: number; reminders: number; course_ids: string[] }>("/courses/assign-external-bulk", { method: "POST", body: JSON.stringify(payload) }),
  roleSuggestions: (q = "") => request<{ items: string[] }>(`/courses/role-suggestions${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  groupEnrollInternal: (payload: { course_id: string; user_ids: string[] }) => request<{ created: number }>("/courses/group-enroll", { method: "POST", body: JSON.stringify(payload) }),
  getCourse: (courseId: string) => request<Course>(`/courses/${courseId}`),
  enroll: (course_id: string) => request<Enrollment>("/enrollments/", { method: "POST", body: JSON.stringify({ course_id }) }),
  myEnrollments: () => request<Enrollment[]>("/enrollments/mine"),
  completeEnrollment: (enrollmentId: string) => request<Enrollment>(`/enrollments/${enrollmentId}/complete`, { method: "POST" }),
  myExternalRequests: () => request<ExternalRequest[]>("/external-requests/mine"),
  pendingExternalRequests: () => request<ExternalRequest[]>("/external-requests/pending"),
  createExternalRequest: (payload: Record<string, unknown>) => request<ExternalRequest>("/external-requests/", { method: "POST", body: JSON.stringify(payload) }),
  managerApprove: (id: string, comment?: string) => request<ExternalRequest>(`/external-requests/${id}/manager-approve`, { method: "POST", body: JSON.stringify({ comment }) }),
  managerReject: (id: string, comment?: string) => request<ExternalRequest>(`/external-requests/${id}/manager-reject`, { method: "POST", body: JSON.stringify({ comment }) }),
  hrApprove: (id: string, comment?: string) => request<ExternalRequest>(`/external-requests/${id}/hr-approve`, { method: "POST", body: JSON.stringify({ comment }) }),
  hrReject: (id: string, comment?: string) => request<ExternalRequest>(`/external-requests/${id}/hr-reject`, { method: "POST", body: JSON.stringify({ comment }) }),
  myCertificates: () => request<Certificate[]>("/certificates/mine"),
  createCertificate: (payload: Record<string, unknown>) => request<Certificate>("/certificates/", { method: "POST", body: JSON.stringify(payload) }),
  uploadCertificate: (payload: { source: string; issuer_name?: string; certificate_number?: string; issue_date?: string; course_id?: string; enrollment_id?: string; file: File }) => { const fd = new FormData(); Object.entries(payload).forEach(([k,v]) => { if (v) fd.append(k, v as any); }); return request<Certificate>("/certificates/upload", { method: "POST", body: fd }); },
  myNotifications: () => request<Notification[]>("/notifications/mine"),
  markNotificationRead: (id: string) => request<Notification>(`/notifications/${id}/read`, { method: "POST" }),
  myCalendarEvents: () => request<CalendarEvent[]>("/calendar/mine"),
  userCalendarEvents: (userId: string) => request<CalendarEvent[]>(`/calendar/user/${userId}`),
  outlookStatus: () => request<OutlookStatus>("/calendar/outlook/status"),
  outlookConnectUrl: () => request<{ authorize_url: string }>("/calendar/outlook/connect-url"),
  outlookDisconnect: () => request<{ ok: boolean }>("/calendar/outlook/disconnect", { method: "POST" }),
  resyncInternalOutlook: () => request<{ ok: boolean; created: number; synced: number }>("/calendar/outlook/resync-internal", { method: "POST" }),
  hrDashboardMetrics: () => request<HRDashboardMetrics>("/metrics/hr-dashboard"),
  homeMetrics: () => request<HomeMetrics>("/metrics/home"),
  createReview: (payload: { course_id: string; enrollment_id: string; rating: number; comment?: string }) => request<Review>("/reviews/", { method: "POST", body: JSON.stringify(payload) }),
  courseReviews: (courseId: string) => request<Review[]>(`/reviews/course/${courseId}`),
  listUsers: () => request<User[]>("/users/"),
  createUser: (payload: Record<string, unknown>) => request<User>("/users/", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (userId: string, payload: Record<string, unknown>) => request<User>(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  userProfileSummary: (userId: string) => request<UserProfileSummary>(`/users/${userId}/profile-summary`),
  listDepartments: () => request<Department[]>("/departments/"),
  createDepartment: (payload: { name: string; code?: string }) => request<Department>("/departments/", { method: "POST", body: JSON.stringify(payload) }),
  monitorMetrics: (departmentId?: string) => request<MonitorPayload>(`/metrics/monitor${departmentId ? `?department_id=${departmentId}` : ""}`),
  monitorExportUrl: (departmentId?: string) => `${API_PREFIX}/metrics/monitor-export${departmentId ? `?department_id=${departmentId}` : ""}`,
  courseTrack: (courseId: string) => request<CourseTrack>(`/courses/${courseId}/track`),
  completeLesson: (enrollmentId: string, lessonId: string) => request<Enrollment>(`/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, { method: "POST" }),
};
