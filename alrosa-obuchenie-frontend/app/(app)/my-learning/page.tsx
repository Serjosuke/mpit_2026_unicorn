"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
import { ArrowRight, Award, Clock3, ExternalLink, PlusCircle, Target } from "lucide-react";
=======
import { ArrowRight, CheckCircle2, Clock3, ExternalLink, PlusCircle, Star } from "lucide-react";
>>>>>>> d839566c6f869da06a6c368782231753931b1123
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, Enrollment, ExternalRequest } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

<<<<<<< HEAD
type LearningItem = { enrollment: Enrollment; course?: Course };

const tabs = [
  { key: "all", label: "Все мои курсы" },
  { key: "internal", label: "Внутренние" },
  { key: "external", label: "Внешние" },
  { key: "requests", label: "Мои заявки" },
  { key: "completed", label: "Завершённые" },
] as const;

function sortItems(items: LearningItem[]) {
  return [...items].sort((a, b) => {
    const aDate = a.enrollment.target_completion_date || a.enrollment.updated_at || a.enrollment.created_at;
    const bDate = b.enrollment.target_completion_date || b.enrollment.updated_at || b.enrollment.created_at;
    return String(aDate).localeCompare(String(bDate));
  });
}

=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
export default function MyLearningPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [requests, setRequests] = useState<ExternalRequest[]>([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
=======
  const [busyId, setBusyId] = useState<string | null>(null);
>>>>>>> d839566c6f869da06a6c368782231753931b1123

  async function load() {
    setLoading(true);
    try {
<<<<<<< HEAD
      const [courseData, enrollmentData, requestData] = await Promise.all([
        api.listCourses(),
        api.myEnrollments(),
        api.myExternalRequests(),
      ]);
=======
      const [courseData, enrollmentData, requestData] = await Promise.all([api.listCourses(), api.myEnrollments(), api.myExternalRequests()]);
>>>>>>> d839566c6f869da06a6c368782231753931b1123
      setCourses(courseData);
      setEnrollments(enrollmentData);
      setRequests(requestData);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить мои курсы");
    } finally {
      setLoading(false);
    }
  }

<<<<<<< HEAD
  useEffect(() => {
    void load();
  }, []);

  const allItems = useMemo(
    () => enrollments.map((enrollment) => ({ enrollment, course: courses.find((course) => course.id === enrollment.course_id) })),
    [enrollments, courses]
  );

  const activeItems = useMemo(() => sortItems(allItems.filter((item) => item.enrollment.status !== "completed")), [allItems]);
  const internalItems = useMemo(() => activeItems.filter((item) => item.course?.course_type === "internal"), [activeItems]);
  const externalItems = useMemo(() => activeItems.filter((item) => item.course?.course_type === "external"), [activeItems]);
  const completedItems = useMemo(
    () => [...allItems.filter((item) => item.enrollment.status === "completed")].sort((a, b) => String(b.enrollment.completed_at || b.enrollment.updated_at || "").localeCompare(String(a.enrollment.completed_at || a.enrollment.updated_at || ""))),
    [allItems]
  );

  if (loading) return <AppShell title="Мои курсы" subtitle="Загрузка персонального трека"><PageLoader /></AppShell>;

  const activeList = tab === "internal" ? internalItems : tab === "external" ? externalItems : activeItems;
=======
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
>>>>>>> d839566c6f869da06a6c368782231753931b1123

  return (
    <AppShell title="Мои курсы">
      <div className="card card-pad">
        <div className="flex flex-wrap gap-2">
<<<<<<< HEAD
          {tabs.map((item) => (
            <button key={item.key} className={tab === item.key ? "btn-primary" : "btn-secondary"} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
=======
          {[
            { key: "all", label: "Все мои курсы" },
            { key: "internal", label: "Внутренние" },
            { key: "external", label: "Внешние" },
            { key: "requests", label: "Мои заявки" },
          ].map((item) => (
            <button key={item.key} className={tab === item.key ? "btn-primary" : "btn-secondary"} onClick={() => setTab(item.key)}>{item.label}</button>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
<<<<<<< HEAD
        {(tab === "all" || tab === "internal" || tab === "external") ? (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {tab === "internal" ? "Внутренние курсы" : tab === "external" ? "Внешние курсы" : "Активные курсы"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Прогресс, выполнение заданий и завершение курса доступны только после открытия курса внутри этого раздела.
                </p>
              </div>
              <Link href={tab === "external" ? "/courses?tab=external" : "/courses"} className="text-sm font-medium text-brand-700 hover:underline">
                Открыть каталог
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {activeList.map(({ enrollment, course }) => {
                if (!course) return null;
                const isExternal = course.course_type === "external";
                return (
                  <article key={enrollment.id} className="card card-pad">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`text-xs font-semibold uppercase tracking-wide ${isExternal ? "text-emerald-700" : "text-brand-700"}`}>
                          {isExternal ? "Внешний курс" : "Внутренний курс"}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{course.title}</h3>
                        <div className="mt-1 text-sm text-slate-500">{course.provider_name || "ALROSA Academy"}</div>
                      </div>
                      <StatusBadge status={enrollment.status} />
                    </div>

                    <p className="mt-3 text-sm text-slate-500">{course.summary || course.description || "Курс доступен в треке обучения."}</p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="panel-muted p-4">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>Прогресс</span>
                          <span>{enrollment.progress_percent}%</span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-brand-700" style={{ width: `${Math.max(enrollment.progress_percent, 4)}%` }} />
                        </div>
                      </div>
                      <div className="panel-muted p-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Дедлайн</div>
                        <div className="mt-2 font-semibold text-slate-900">{enrollment.target_completion_date ? formatDate(enrollment.target_completion_date) : "Не задан"}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[24px] border border-slate-200 p-4 text-sm text-slate-600">
                      {isExternal
                        ? "Менять процент прохождения и завершать внешний курс можно только после открытия этой карточки из раздела «Мои курсы»."
                        : "Внутренний курс завершается только после выполнения всех заданий внутри рабочей карточки курса."}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/my-learning/${course.id}`} className="btn-primary"><ArrowRight className="h-4 w-4" />Открыть курс</Link>
                      <Link href={`/courses/${course.id}`} className="btn-secondary"><Target className="h-4 w-4" />Карточка в каталоге</Link>
                      {course.provider_url ? <a href={course.provider_url} target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink className="h-4 w-4" />К провайдеру</a> : null}
                    </div>
                  </article>
                );
              })}

              {activeList.length === 0 ? (
                <EmptyState
                  title="Активных курсов нет"
                  description="После записи или назначения курсы появятся здесь. Завершённые курсы смотри в отдельной вкладке."
                  action={<Link href="/courses" className="btn-primary"><PlusCircle className="h-4 w-4" />Открыть каталог</Link>}
                />
              ) : null}
=======
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
>>>>>>> d839566c6f869da06a6c368782231753931b1123
            </div>
          </section>
        ) : null}

<<<<<<< HEAD
        {tab === "completed" ? (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">Завершённые курсы</h2>
              <p className="mt-1 text-sm text-slate-500">Все уже закрытые внутренние и внешние программы собраны отдельно.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {completedItems.map(({ enrollment, course }) => (
                <article key={enrollment.id} className="card card-pad">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        {course?.course_type === "external" ? "Внешний курс" : "Внутренний курс"}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{course?.title || "Курс"}</h3>
                      <div className="mt-1 text-sm text-slate-500">Завершён: {formatDateTime(enrollment.completed_at || enrollment.updated_at)}</div>
                    </div>
                    <StatusBadge status="completed" />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="panel-muted p-4">
                      <div className="text-sm text-slate-500">Финальный прогресс</div>
                      <div className="mt-2 text-3xl font-bold text-slate-900">100%</div>
                    </div>
                    <div className="panel-muted p-4">
                      <div className="text-sm text-slate-500">Провайдер</div>
                      <div className="mt-2 text-base font-semibold text-slate-900">{course?.provider_name || "ALROSA Academy"}</div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {course ? <Link href={`/my-learning/${course.id}`} className="btn-secondary"><Target className="h-4 w-4" />Открыть курс</Link> : null}
                    {course ? <Link href={`/courses/${course.id}`} className="btn-secondary">Карточка в каталоге</Link> : null}
                    <Link href="/certificates" className="btn-primary"><Award className="h-4 w-4" />Сертификаты</Link>
                  </div>
                </article>
              ))}
              {completedItems.length === 0 ? <EmptyState title="Пока нет завершённых курсов" description="Как только курс будет закрыт, он появится в этой вкладке." /> : null}
            </div>
          </section>
        ) : null}

        {tab === "requests" ? (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Мои заявки на одобрение</h2>
              <Link href="/courses?tab=external" className="text-sm font-medium text-brand-700 hover:underline">Создать новую</Link>
            </div>
=======
        {tab === "requests" ? (
          <section>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">Мои заявки на одобрение</h2><Link href="/courses?tab=external" className="text-sm font-medium text-brand-700 hover:underline">Создать новую</Link></div>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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
