"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BookOpen, Clock3, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { PageLoader } from "@/components/common/page-loader";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, Enrollment, HomeMetrics, Notification } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listCourses(), api.myEnrollments(), api.myNotifications(), api.homeMetrics()])
      .then(([courses, enrollments, notifications, metrics]) => { setCourses(courses); setEnrollments(enrollments); setNotifications(notifications); setMetrics(metrics); })
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить главную"))
      .finally(() => setLoading(false));
  }, []);

  const inProgress = enrollments.filter((item) => item.status === "in_progress").length;
  const completed = enrollments.filter((item) => item.status === "completed").length;
  const unreadNotifications = notifications.filter((item) => !item.is_read).length;
  const recommended = useMemo(() => courses.filter((course) => !enrollments.find((e) => e.course_id === course.id)).slice(0, 4), [courses, enrollments]);

  if (loading) return <AppShell title="Главная" subtitle="Загрузка персональной панели сотрудника"><PageLoader /></AppShell>;

  return (
    <AppShell title="Главная" subtitle="Все, что важно сегодня: прогресс, ближайший урок, активные дедлайны и рекомендованные курсы.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Активные курсы" value={metrics?.active_courses ?? inProgress} hint="Продолжаются прямо сейчас" />
        <StatCard label="Завершено" value={metrics?.completed_courses ?? completed} hint="Курсы со 100% прогрессом" />
        <StatCard label="Сертификаты" value={metrics?.certificates ?? 0} hint="Файлы видны в профиле" />
        <StatCard label="Новые уведомления" value={unreadNotifications} hint="Напоминания, дедлайны и события" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.92fr]">
        <section className="card card-pad">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><Sparkles className="h-3.5 w-3.5" />Следующее важное действие</div>
              <h3 className="mt-3 text-2xl font-bold">Урок, который лучше сделать сейчас</h3>
            </div>
            <Link href="/my-learning" className="btn-secondary">Открыть обучение</Link>
          </div>

          {metrics?.urgent_lesson ? (
            <div className={`mt-6 rounded-[28px] border p-5 ${metrics.urgent_lesson.deadline_status === "danger" ? "border-rose-200 bg-rose-50" : metrics.urgent_lesson.deadline_status === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-600">{metrics.urgent_lesson.course_title}</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{metrics.urgent_lesson.lesson_title}</div>
                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4" />Дедлайн: {formatDateTime(metrics.urgent_lesson.due_at)}</div>
                </div>
                <div className="flex flex-col items-start gap-3">
                  <StatusBadge status={metrics.urgent_lesson.deadline_status} />
                  <Link href={`/courses/${metrics.urgent_lesson.course_id}`} className="btn-primary"><ArrowRight className="mr-2 h-4 w-4" />Перейти к уроку</Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">Сейчас нет просроченных или срочных уроков. Хороший момент продолжить текущий курс в обычном темпе.</div>
          )}

          <div className="mt-8">
            <h3 className="text-xl font-bold">Рекомендуемые курсы</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {recommended.map((course) => (
                <article key={course.id} className="rounded-[28px] border border-slate-200 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">{course.course_type === "internal" ? "Внутренний курс" : "Внешний курс"}</div>
                  <h4 className="mt-2 text-lg font-semibold">{course.title}</h4>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-500">{course.description || "Практический курс с уроками, дедлайнами и сертификатом."}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <StatusBadge status={course.status} />
                    <Link href={`/courses/${course.id}`} className="btn-primary">Открыть</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-500" /><h3 className="text-xl font-bold">Фокус на сегодня</h3></div>
            <div className="mt-4 space-y-3">
              <div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Активных курсов</div><div className="mt-1 text-3xl font-bold">{metrics?.active_courses ?? 0}</div></div>
              <div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Ближайший блок</div><div className="mt-1 text-base font-semibold">{metrics?.urgent_lesson?.lesson_title || "Нет срочных задач"}</div></div>
            </div>
          </section>
          <section className="card card-pad">
            <div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-blue-600" /><h3 className="text-xl font-bold">Уведомления</h3></div>
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 5).map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="font-medium">{item.title}</div><div className="mt-1 text-sm text-slate-500">{item.body}</div></div>)}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
