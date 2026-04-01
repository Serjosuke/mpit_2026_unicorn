"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, ExternalLink, PlusCircle, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, Enrollment, ExternalRequest } from "@/lib/types";

export default function MyLearningPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [requests, setRequests] = useState<ExternalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [courseData, enrollmentData, requestData] = await Promise.all([api.listCourses(), api.myEnrollments(), api.myExternalRequests()]);
      setCourses(courseData);
      setEnrollments(enrollmentData);
      setRequests(requestData);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить мои курсы");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const internalItems = useMemo(() => enrollments.map((enrollment) => ({ enrollment, course: courses.find((course) => course.id === enrollment.course_id) })).filter((item) => item.course?.course_type === "internal"), [enrollments, courses]);
  const externalItems = useMemo(() => enrollments.map((enrollment) => ({ enrollment, course: courses.find((course) => course.id === enrollment.course_id) })).filter((item) => item.course?.course_type === "external"), [enrollments, courses]);

  async function completeEnrollment(enrollmentId: string) {
    setBusyId(enrollmentId);
    try {
      await api.completeEnrollment(enrollmentId);
      toast.success("Курс отмечен как завершенный");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось завершить курс");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <AppShell title="Мои курсы" subtitle="Загрузка персонального трека"><PageLoader /></AppShell>;

  return (
    <AppShell title="Мои курсы">
      <div className="card card-pad">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Все мои курсы" },
            { key: "internal", label: "Внутренние" },
            { key: "external", label: "Внешние" },
            { key: "requests", label: "Мои заявки" },
          ].map((item) => (
            <button key={item.key} className={tab === item.key ? "btn-primary" : "btn-secondary"} onClick={() => setTab(item.key)}>{item.label}</button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {(tab === "all" || tab === "internal") ? (
          <section>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">Внутренние курсы</h2><Link href="/courses?tab=internal" className="text-sm font-medium text-brand-700 hover:underline">Открыть каталог</Link></div>
            <div className="grid gap-4 lg:grid-cols-2">
              {internalItems.map(({ enrollment, course }) => (
                <article key={enrollment.id} className="card card-pad">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Внутренний курс</div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{course?.title}</h3>
                    </div>
                    <StatusBadge status={enrollment.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{course?.summary || course?.description || "Курс доступен с уроками и дедлайнами."}</p>
                  <div className="mt-4 panel-muted p-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-500"><span>Прогресс</span><span>{enrollment.progress_percent}%</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-700" style={{ width: `${enrollment.progress_percent}%` }} /></div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/courses/${course?.id}`} className="btn-primary"><ArrowRight className="h-4 w-4" />Страница курса</Link>
                    {enrollment.status !== "completed" ? <button className="btn-success" onClick={() => completeEnrollment(enrollment.id)} disabled={busyId === enrollment.id}><CheckCircle2 className="h-4 w-4" />Завершить</button> : <button className="btn-secondary"><Star className="h-4 w-4" />Завершен</button>}
                  </div>
                </article>
              ))}
              {internalItems.length === 0 ? <EmptyState title="Нет внутренних курсов" description="После назначения или записи внутренние программы появятся здесь." /> : null}
            </div>
          </section>
        ) : null}

        {(tab === "all" || tab === "external") ? (
          <section>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">Внешние курсы</h2><Link href="/courses?tab=external" className="text-sm font-medium text-brand-700 hover:underline">Поиск внешних курсов</Link></div>
            <div className="grid gap-4 lg:grid-cols-2">
              {externalItems.map(({ enrollment, course }) => (
                <article key={enrollment.id} className="card card-pad">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Внешний курс</div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{course?.title}</h3>
                    </div>
                    <StatusBadge status={enrollment.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{course?.summary || course?.description || "Внешний курс доступен по внешней ссылке."}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    {course?.provider_name ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.provider_name}</span> : null}
                    {course?.duration_hours ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.duration_hours} ч</span> : null}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/courses/${course?.id}`} className="btn-primary"><Clock3 className="h-4 w-4" />Тайминги и детали</Link>
                    {course?.provider_url ? <a href={course.provider_url} target="_blank" className="btn-secondary"><ExternalLink className="h-4 w-4" />Перейти к курсу</a> : null}
                  </div>
                </article>
              ))}
              {externalItems.length === 0 ? <EmptyState title="Нет внешних курсов" description="Одобренные или назначенные внешние курсы будут отображаться отдельно от внутренних." action={<Link href="/courses?tab=external" className="btn-primary"><PlusCircle className="h-4 w-4" />Найти внешний курс</Link>} /> : null}
            </div>
          </section>
        ) : null}

        {tab === "requests" ? (
          <section>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">Мои заявки на одобрение</h2><Link href="/courses?tab=external" className="text-sm font-medium text-brand-700 hover:underline">Создать новую</Link></div>
            <div className="grid gap-4 lg:grid-cols-2">
              {requests.map((request) => (
                <article key={request.id} className="card card-pad">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{request.title}</h3>
                      <div className="mt-1 text-sm text-slate-500">{request.provider_name}</div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{request.justification}</p>
                  <div className="mt-4 panel-muted p-4 text-sm text-slate-600">Стоимость: {request.cost_amount} {request.cost_currency}</div>
                </article>
              ))}
              {requests.length === 0 ? <EmptyState title="Заявок пока нет" description="После отправки заявки на внешний курс она появится здесь со статусом согласования." /> : null}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
