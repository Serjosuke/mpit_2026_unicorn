"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, CheckCheck, Clock10 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import type { Course, Enrollment, ExternalRequest } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function CalendarPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [requests, setRequests] = useState<ExternalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listCourses(), api.myEnrollments(), api.myExternalRequests()])
      .then(([courses, enrollments, requests]) => {
        setCourses(courses);
        setEnrollments(enrollments);
        setRequests(requests);
      })
      .catch((error) => {
        const message = error instanceof ApiError ? error.detail : "Не удалось загрузить календарь";
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
    return [
      ...enrollments.map((enrollment) => ({
        id: enrollment.id,
        kind: "course",
        title: courses.find((course) => course.id === enrollment.course_id)?.title || "Курс",
        date: enrollment.created_at,
        status: enrollment.status
      })),
      ...requests.map((request) => ({
        id: request.id,
        kind: "external",
        title: request.title,
        date: request.created_at,
        status: request.status
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [courses, enrollments, requests]);

  return (
    <AppShell title="Календарь" subtitle="Сводный график по обучению. Пока без прямого Outlook API, но уже с календарным представлением данных">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card card-pad">
          <div className="flex items-center gap-3">
            <div className="rounded-3xl bg-brand-50 p-3 text-brand-700">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">События обучения</h3>
              <p className="text-sm text-slate-500">Лента последних записей, курсов и заявок</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 p-4">
                  <div className="skeleton h-5 w-32" />
                  <div className="mt-3 skeleton h-4 w-full" />
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                Пока календарных событий нет. Запишись на курс или создай внешнюю заявку.
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{item.kind === "course" ? "Курс" : "Внешняя заявка"}</p>
                      <h4 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h4>
                    </div>
                    <span className="badge bg-slate-100 text-slate-700">{item.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{formatDate(item.date)}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <div className="flex items-center gap-3">
              <Clock10 className="h-5 w-5 text-brand-700" />
              <h3 className="text-xl font-bold text-slate-900">Outlook-ready логика</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Backend пока не содержит отдельного Microsoft Graph / Outlook endpoint. Поэтому эта страница показывает уже привязанные даты и статусы из enrollments и external requests. Когда Outlook API появится, сюда легко добавится реальная синхронизация событий.
            </p>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-3">
              <CheckCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-xl font-bold text-slate-900">Что уже готово</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• общий календарный обзор</li>
              <li>• отражение статусов согласования</li>
              <li>• привязка к записанным курсам</li>
              <li>• основа под дедлайны и напоминания</li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
