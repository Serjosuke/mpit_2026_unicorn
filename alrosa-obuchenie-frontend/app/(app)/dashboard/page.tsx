"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, Clock3, GraduationCap, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { PageLoader } from "@/components/common/page-loader";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api";
import type { Course, Enrollment, HomeMetrics, Notification } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function scoreCourse(course: Course, roleText: string, load: number) {
  const text = `${course.title} ${course.summary || ""} ${course.description || ""} ${course.skill_tags || ""}`.toLowerCase();
  let score = 0;
  if (course.is_featured_internal) score += 20;
  if (course.course_type === "internal") score += 16;
  if (roleText.includes("frontend") || roleText.includes("react")) {
    if (text.includes("frontend") || text.includes("react") || text.includes("коммуникац")) score += 18;
  }
  if (roleText.includes("backend") || roleText.includes("java")) {
    if (text.includes("backend") || text.includes("java") || text.includes("spring")) score += 18;
  }
  if (roleText.includes("manager") || roleText.includes("руковод")) {
    if (text.includes("управ") || text.includes("коммуникац") || text.includes("product")) score += 16;
  }
  if (load >= 3 && (course.duration_hours || 0) > 20) score -= 10;
  if (load >= 3 && (course.duration_hours || 0) <= 12) score += 8;
  if (load <= 1 && (course.duration_hours || 0) >= 12) score += 4;
  return score + Math.max(0, 10 - (course.source_priority || 10));
}

export default function DashboardPage() {
  const { user } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listCourses(), api.myEnrollments(), api.myNotifications(), api.homeMetrics()])
      .then(([courses, enrollments, notifications, metrics]) => {
        setCourses(courses);
        setEnrollments(enrollments);
        setNotifications(notifications);
        setMetrics(metrics);
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить главную"))
      .finally(() => setLoading(false));
  }, []);

  const activeLoad = enrollments.filter((item) => item.status === "in_progress").length;
  const enrolledIds = new Set(enrollments.map((item) => item.course_id));
  const roleText = `${user?.position_title || ""} ${user?.team_name || ""}`.toLowerCase();

  const recommended = useMemo(
    () => courses.filter((course) => !enrolledIds.has(course.id)).sort((a, b) => scoreCourse(b, roleText, activeLoad) - scoreCourse(a, roleText, activeLoad)).slice(0, 4),
    [courses, roleText, activeLoad]
  );

  const featured = useMemo(
    () => courses.filter((course) => course.is_featured_internal && !enrolledIds.has(course.id)).slice(0, 4),
    [courses, enrollments]
  );

  if (loading) return <AppShell title="Главная" subtitle="Загрузка персональной панели"><PageLoader /></AppShell>;

  const isHR = user?.role === "hr" || user?.role === "admin";
<<<<<<< HEAD
  const isManager = user?.role === "manager";
=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123

  return (
    <AppShell title={isHR ? "Рабочее место HR / L&D" : "Dashboard"} >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Активные курсы" value={metrics?.active_courses ?? activeLoad} hint="В работе сейчас" />
        <StatCard label="Завершено" value={metrics?.completed_courses ?? enrollments.filter((x) => x.status === "completed").length} hint="Уже пройдено" />
        <StatCard label="Сертификаты" value={metrics?.certificates ?? 0} hint="Доступны в профиле" />
        <StatCard label="Уведомления" value={notifications.filter((n) => !n.is_read).length} hint="Новые события" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="space-y-6">
          <div className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"><Sparkles className="h-3.5 w-3.5" />AI-приоритет на сегодня</div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Что лучше открыть сейчас</h2>
              </div>
              <Link href="/courses" className="btn-secondary">Открыть каталог</Link>
            </div>

            {metrics?.urgent_lesson ? (
              <div className="mt-5 rounded-[24px] border border-brand-100 bg-brand-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-600">{metrics.urgent_lesson.course_title}</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{metrics.urgent_lesson.lesson_title}</div>
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4" />Дедлайн: {formatDateTime(metrics.urgent_lesson.due_at)}</div>
                  </div>
                  <div className="flex flex-col items-start gap-3">
                    <StatusBadge status={metrics.urgent_lesson.deadline_status} />
                    <Link href={`/courses/${metrics.urgent_lesson.course_id}`} className="btn-primary"><ArrowRight className="h-4 w-4" />Перейти</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 panel-muted p-5 text-sm text-slate-600">Срочных уроков сейчас нет. Можно спокойно выбрать следующий курс по приоритету.</div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card card-pad">
              <div className="flex items-center gap-2 text-slate-900"><GraduationCap className="h-5 w-5 text-brand-700" /><h3 className="text-xl font-bold">Рекомендовано для роли</h3></div>
              <div className="mt-4 space-y-3">
                {recommended.map((course) => (
                  <article key={course.id} className="rounded-[20px] border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.course_type === "internal" ? "Внутренний курс" : "Внешний курс"}</div>
                        <h4 className="mt-1 text-base font-semibold text-slate-900">{course.title}</h4>
                      </div>
                      <StatusBadge status={course.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{course.summary || course.description || "Курс доступен в корпоративном каталоге."}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>{course.duration_hours ? `${course.duration_hours} ч` : "Без оценки длительности"}</span>
                      <Link href={`/courses/${course.id}`} className="text-brand-700 hover:underline">Открыть</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="card card-pad">
              <div className="flex items-center gap-2 text-slate-900"><BriefcaseBusiness className="h-5 w-5 text-emerald-600" /><h3 className="text-xl font-bold">Рекомендовано HR</h3></div>
              <div className="mt-4 space-y-3">
                {featured.map((course) => (
                  <article key={course.id} className="rounded-[20px] border border-slate-200 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Приоритет компании</div>
                    <h4 className="mt-1 text-base font-semibold text-slate-900">{course.title}</h4>
                    <p className="mt-2 text-sm text-slate-500">{course.summary || course.description || "Рекомендованный корпоративный курс."}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>{course.provider_name || "ALROSA Academy"}</span>
                      <Link href={`/courses/${course.id}`} className="text-brand-700 hover:underline">Открыть</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-brand-700" /><h3 className="text-lg font-bold">Быстрые переходы</h3></div>
            <div className="mt-4 grid gap-3">
              <Link href="/my-learning" className="panel-muted flex items-center justify-between p-4 text-sm font-medium text-slate-700">Мои курсы <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/courses?tab=external" className="panel-muted flex items-center justify-between p-4 text-sm font-medium text-slate-700">Поиск внешних курсов <ArrowRight className="h-4 w-4" /></Link>
<<<<<<< HEAD
              {(user?.role === "hr" || user?.role === "admin" || user?.role === "manager") ? <Link href="/hr-dashboard" className="panel-muted flex items-center justify-between p-4 text-sm font-medium text-slate-700">Перейти в HR-монитор <ArrowRight className="h-4 w-4" /></Link> : null}
              {isManager ? <Link href="/course-builder" className="panel-muted flex items-center justify-between p-4 text-sm font-medium text-slate-700">Конструктор курса <ArrowRight className="h-4 w-4" /></Link> : null}
=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
              {isHR ? <Link href="/approvals" className="panel-muted flex items-center justify-between p-4 text-sm font-medium text-slate-700">Очередь согласований <ArrowRight className="h-4 w-4" /></Link> : null}
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-2"><Users className="h-5 w-5 text-slate-700" /><h3 className="text-lg font-bold">Последние уведомления</h3></div>
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-[20px] border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.body}</div>
                </div>
              ))}
              {notifications.length === 0 ? <div className="panel-muted p-4 text-sm text-slate-500">Пока уведомлений нет.</div> : null}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
