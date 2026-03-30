"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Clock3, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { PageLoader } from "@/components/common/page-loader";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, Enrollment, ExternalRequest, Notification } from "@/lib/types";
import { formatDateTime, requestStatusLabel } from "@/lib/utils";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [requests, setRequests] = useState<ExternalRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listCourses(),
      api.myEnrollments(),
      api.myExternalRequests(),
      api.myNotifications()
    ])
      .then(([courses, enrollments, requests, notifications]) => {
        setCourses(courses);
        setEnrollments(enrollments);
        setRequests(requests);
        setNotifications(notifications);
      })
      .catch((error) => {
        const message = error instanceof ApiError ? error.detail : "Не удалось загрузить дашборд";
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);

  const inProgress = enrollments.filter((item) => item.status === "in_progress").length;
  const completed = enrollments.filter((item) => item.status === "completed").length;
  const unreadNotifications = notifications.filter((item) => !item.is_read).length;

  const recommended = useMemo(
    () => courses.filter((course) => !enrollments.find((enrollment) => enrollment.course_id === course.id)).slice(0, 4),
    [courses, enrollments]
  );

  if (loading) {
    return (
      <AppShell title="Главная" subtitle="Загрузка данных и персональных рекомендаций">
        <PageLoader />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Главная"
      subtitle="Персональная панель сотрудника: текущие курсы, внешнее обучение, уведомления и активность."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Все курсы" value={courses.length} hint="Каталог внутренних и внешних программ" />
        <StatCard label="В процессе" value={inProgress} hint="Текущие курсы с активным прогрессом" />
        <StatCard label="Завершено" value={completed} hint="Курсы, по которым можно получить пользу и отзыв" />
        <StatCard label="Новые уведомления" value={unreadNotifications} hint="Согласования, сертификаты, системные события" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card card-pad xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <Sparkles className="h-3.5 w-3.5" />
                Рекомендуем начать
              </div>
              <h3 className="mt-3 text-xl font-bold">Подборка курсов для сотрудника</h3>
            </div>
            <Link href="/courses" className="btn-secondary">
              Весь каталог
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {recommended.map((course) => (
              <article key={course.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.course_type}</p>
                    <h4 className="mt-2 text-lg font-semibold text-slate-900">{course.title}</h4>
                  </div>
                  <StatusBadge status={course.status} />
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-slate-500">
                  {course.description || "Курс помогает развивать soft skills и цифровые навыки внутри корпоративной среды."}
                </p>
                <div className="mt-5">
                  <Link href={`/courses/${course.id}`} className="btn-primary">
                    Открыть курс
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card card-pad">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Внешние заявки</h3>
            <Link href="/my-learning?tab=external" className="text-sm font-semibold text-brand-700">
              Смотреть все
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {requests.slice(0, 5).map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{request.title}</h4>
                    <p className="mt-1 text-xs text-slate-500">{request.provider_name}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-3 text-sm text-slate-500">{requestStatusLabel(request.status)}</p>
              </div>
            ))}
            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Пока нет внешних заявок. Можно создать первую заявку на обучение.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-6 card card-pad">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Последние уведомления</h3>
          <Link href="/notifications" className="btn-secondary">
            Все уведомления
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {notifications.slice(0, 4).map((notification) => (
            <div key={notification.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-700" />
                  <h4 className="truncate font-semibold text-slate-900">{notification.title}</h4>
                </div>
                <p className="mt-1 text-sm text-slate-500">{notification.body}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <Clock3 className="h-4 w-4" />
                {formatDateTime(notification.created_at)}
              </div>
            </div>
          ))}
          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              Пока уведомлений нет. Здесь будут появляться статусы согласований, завершения курсов и сертификатов.
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <Link href="/my-learning" className="btn-primary">
          Перейти в мое обучение
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </AppShell>
  );
}
