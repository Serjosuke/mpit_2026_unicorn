"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle, PlusCircle, Star } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, Enrollment, ExternalRequest } from "@/lib/types";

const tabs: { id: "internal" | "external"; label: string }[] = [
  { id: "internal", label: "Внутренние курсы" },
  { id: "external", label: "Внешние заявки" }
];

export default function MyLearningPage() {
  const [tab, setTab] = useState<"internal" | "external">("internal");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [requests, setRequests] = useState<ExternalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<{ enrollmentId: string; courseId: string } | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [requestForm, setRequestForm] = useState({
    title: "",
    provider_name: "",
    provider_url: "",
    program_description: "",
    justification: "",
    cost_amount: "",
    cost_currency: "RUB",
    requested_start_date: "",
    requested_end_date: "",
    estimated_duration_hours: "",
    budget_code: ""
  });

  async function load() {
    setLoading(true);
    try {
      const [courses, enrollments, requests] = await Promise.all([
        api.listCourses(),
        api.myEnrollments(),
        api.myExternalRequests()
      ]);
      setCourses(courses);
      setEnrollments(enrollments);
      setRequests(requests);
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось загрузить обучение";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab === "external") {
        setTab("external");
      }
    }
    void load();
  }, []);

  const internalItems = useMemo(() => {
    return enrollments
      .map((enrollment) => ({
        enrollment,
        course: courses.find((course) => course.id === enrollment.course_id)
      }))
      .filter((item) => item.course);
  }, [courses, enrollments]);

  async function completeEnrollment(enrollmentId: string) {
    setBusyId(enrollmentId);
    try {
      await api.completeEnrollment(enrollmentId);
      toast.success("Курс завершён, сертификат сформирован");
      await load();
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось завершить курс";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function submitReview() {
    if (!reviewing) return;
    setBusyId(reviewing.enrollmentId);
    try {
      await api.createReview({
        enrollment_id: reviewing.enrollmentId,
        course_id: reviewing.courseId,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      toast.success("Отзыв отправлен");
      setReviewing(null);
      setReviewForm({ rating: 5, comment: "" });
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось оставить отзыв";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function submitExternalRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("external-form");
    try {
      await api.createExternalRequest({
        title: requestForm.title,
        provider_name: requestForm.provider_name,
        provider_url: requestForm.provider_url || undefined,
        program_description: requestForm.program_description || undefined,
        justification: requestForm.justification,
        cost_amount: Number(requestForm.cost_amount),
        cost_currency: requestForm.cost_currency,
        requested_start_date: requestForm.requested_start_date || undefined,
        requested_end_date: requestForm.requested_end_date || undefined,
        estimated_duration_hours: requestForm.estimated_duration_hours ? Number(requestForm.estimated_duration_hours) : undefined,
        budget_code: requestForm.budget_code || undefined
      });
      toast.success("Заявка на внешний курс отправлена");
      setRequestForm({
        title: "",
        provider_name: "",
        provider_url: "",
        program_description: "",
        justification: "",
        cost_amount: "",
        cost_currency: "RUB",
        requested_start_date: "",
        requested_end_date: "",
        estimated_duration_hours: "",
        budget_code: ""
      });
      await load();
      setTab("external");
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось создать заявку";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Мое обучение" subtitle="Все внутренние курсы, внешний workflow и завершение обучения в одном разделе">
      <div className="card card-pad">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${tab === item.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 card card-pad">
          <div className="skeleton h-6 w-56" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 p-5">
                <div className="skeleton h-5 w-40" />
                <div className="mt-3 skeleton h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : tab === "internal" ? (
        <section className="mt-6 space-y-6">
          {internalItems.length === 0 ? (
            <EmptyState
              title="Пока нет записей на внутренние курсы"
              description="После записи курс появится здесь. Ты сможешь отслеживать статус, завершение и отправлять отзыв."
            />
          ) : (
            internalItems.map(({ enrollment, course }) => (
              <div key={enrollment.id} className="card card-pad">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course?.course_type}</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">{course?.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {course?.description || "Курс уже связан с пользователем через enrollment и готов к завершению."}
                    </p>
                  </div>
                  <StatusBadge status={enrollment.status} />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                    <span>Прогресс</span>
                    <span>{enrollment.progress_percent}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${enrollment.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {enrollment.status !== "completed" ? (
                    <button className="btn-primary" onClick={() => completeEnrollment(enrollment.id)} disabled={busyId === enrollment.id}>
                      {busyId === enrollment.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Завершить курс
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => setReviewing({ enrollmentId: enrollment.id, courseId: enrollment.course_id })}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Оценить курс
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {reviewing ? (
            <div className="card card-pad">
              <h3 className="text-lg font-bold text-slate-900">Оценка курса</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
                <div>
                  <label className="label">Оценка</label>
                  <select
                    className="input"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm((s) => ({ ...s, rating: Number(e.target.value) }))}
                  >
                    {[5, 4, 3, 2, 1].map((score) => (
                      <option key={score} value={score}>
                        {score}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Комментарий</label>
                  <textarea
                    className="input h-28 py-3"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((s) => ({ ...s, comment: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="btn-primary" onClick={submitReview} disabled={busyId === reviewing.enrollmentId}>
                  {busyId === reviewing.enrollmentId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Отправить отзыв"}
                </button>
                <button className="btn-secondary" onClick={() => setReviewing(null)}>
                  Отмена
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="card card-pad">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{request.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{request.provider_name}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                  Стоимость: {request.cost_amount} {request.cost_currency}
                </div>
              </div>
            ))}
            {requests.length === 0 ? (
              <EmptyState
                title="Внешних заявок пока нет"
                description="Создай новую заявку справа. После отправки она уйдет в workflow согласования."
              />
            ) : null}
          </div>

          <div className="card card-pad">
            <div className="mb-4 flex items-center gap-2 text-brand-700">
              <PlusCircle className="h-5 w-5" />
              <h3 className="text-lg font-bold text-slate-900">Новая заявка на внешний курс</h3>
            </div>
            <form className="space-y-4" onSubmit={submitExternalRequest}>
              <div>
                <label className="label">Название курса</label>
                <input className="input" required value={requestForm.title} onChange={(e) => setRequestForm((s) => ({ ...s, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Провайдер</label>
                <input className="input" required value={requestForm.provider_name} onChange={(e) => setRequestForm((s) => ({ ...s, provider_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Ссылка</label>
                <input className="input" value={requestForm.provider_url} onChange={(e) => setRequestForm((s) => ({ ...s, provider_url: e.target.value }))} />
              </div>
              <div>
                <label className="label">Описание программы</label>
                <textarea className="input h-28 py-3" value={requestForm.program_description} onChange={(e) => setRequestForm((s) => ({ ...s, program_description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Обоснование</label>
                <textarea className="input h-28 py-3" required value={requestForm.justification} onChange={(e) => setRequestForm((s) => ({ ...s, justification: e.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Стоимость</label>
                  <input className="input" type="number" min="0" required value={requestForm.cost_amount} onChange={(e) => setRequestForm((s) => ({ ...s, cost_amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Валюта</label>
                  <input className="input" value={requestForm.cost_currency} onChange={(e) => setRequestForm((s) => ({ ...s, cost_currency: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Дата начала</label>
                  <input className="input" type="date" value={requestForm.requested_start_date} onChange={(e) => setRequestForm((s) => ({ ...s, requested_start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Дата окончания</label>
                  <input className="input" type="date" value={requestForm.requested_end_date} onChange={(e) => setRequestForm((s) => ({ ...s, requested_end_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Часы</label>
                  <input className="input" type="number" min="0" value={requestForm.estimated_duration_hours} onChange={(e) => setRequestForm((s) => ({ ...s, estimated_duration_hours: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Код бюджета</label>
                  <input className="input" value={requestForm.budget_code} onChange={(e) => setRequestForm((s) => ({ ...s, budget_code: e.target.value }))} />
                </div>
              </div>
              <button className="btn-primary h-12 w-full" disabled={busyId === "external-form"}>
                {busyId === "external-form" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Отправить на согласование"}
              </button>
            </form>
          </div>
        </section>
      )}
    </AppShell>
  );
}
