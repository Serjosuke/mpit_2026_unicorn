"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCheck, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/common/stat-card";
import { api, ApiError } from "@/lib/api";
import type { HRDashboardMetrics } from "@/lib/types";

export default function HRDashboardPage() {
  const [metrics, setMetrics] = useState<HRDashboardMetrics | null>(null);

  useEffect(() => {
    api.hrDashboardMetrics()
      .then(setMetrics)
      .catch((error) => {
        const message = error instanceof ApiError ? error.detail : "Не удалось загрузить метрики";
        toast.error(message);
      });
  }, []);

  return (
    <AppShell title="HR / L&D кабинет" subtitle="Контроль обучения, согласований и эффективности программ">
      {!metrics ? (
        <div className="card card-pad text-sm text-slate-500">Загрузка метрик...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Пользователи" value={metrics.total_users} hint="Все роли в системе" />
            <StatCard label="Сотрудники" value={metrics.total_employees} hint="Целевая аудитория LMS" />
            <StatCard label="Курсы" value={metrics.total_courses} hint="Внутренние и внешние программы" />
            <StatCard label="Completion rate" value={`${metrics.completion_rate_percent}%`} hint="Доля завершённых обучений" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <section className="card card-pad">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-brand-700" />
                <h3 className="text-lg font-bold text-slate-900">Роли и охват</h3>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Тренеры: {metrics.total_trainers}</p>
                <p>Активные обучения: {metrics.active_enrollments}</p>
                <p>Завершённые обучения: {metrics.completed_enrollments}</p>
              </div>
            </section>

            <section className="card card-pad">
              <div className="flex items-center gap-3">
                <CheckCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Согласования</h3>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Всего заявок: {metrics.external_requests_total}</p>
                <p>Ждут руководителя: {metrics.external_requests_pending_manager}</p>
                <p>Ждут HR / L&D: {metrics.external_requests_pending_hr}</p>
                <p>Согласовано: {metrics.external_requests_approved}</p>
                <p>Отклонено: {metrics.external_requests_rejected}</p>
              </div>
            </section>

            <section className="card card-pad">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-violet-600" />
                <h3 className="text-lg font-bold text-slate-900">Качество обучения</h3>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Сертификаты: {metrics.certificates_total}</p>
                <p>Отзывы: {metrics.reviews_total}</p>
                <p>Средний рейтинг: {metrics.average_review_rating}</p>
              </div>
            </section>
          </div>

          <section className="mt-6 card card-pad">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-brand-700" />
              <h3 className="text-lg font-bold text-slate-900">Зачем это HR / L&D</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Панель показывает путь данных от заявки до зачисления, сертификата и отзыва. Это соответствует кейсу:
              HR / L&D должен видеть не просто список курсов, а управлять согласованиями, контролировать нагрузку и собирать traceability-метрики.
            </p>
          </section>
        </>
      )}
    </AppShell>
  );
}
