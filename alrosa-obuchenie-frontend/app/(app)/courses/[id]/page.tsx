"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, LoaderCircle, Star } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, CourseTrack, Enrollment, Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const deadlineStyles: Record<string, string> = {
  normal: "border-slate-200 bg-white",
  warning: "border-amber-300 bg-amber-50",
  danger: "border-rose-300 bg-rose-50",
  done: "border-emerald-300 bg-emerald-50",
};

export default function CourseDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [track, setTrack] = useState<CourseTrack | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!params.id) return;
    try {
      const [course, enrollments, reviews, track] = await Promise.all([
        api.getCourse(params.id),
        api.myEnrollments(),
        api.courseReviews(params.id),
        api.courseTrack(params.id).catch(() => null),
      ]);
      setCourse(course);
      setEnrollments(enrollments);
      setReviews(reviews);
      setTrack(track);
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось загрузить курс";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [params.id]);

  const myEnrollment = useMemo(() => enrollments.find((item) => item.course_id === course?.id), [course?.id, enrollments]);

  async function handleEnroll() {
    if (!course) return;
    setBusy(true);
    try {
      if (course.course_type === "external") {
        router.push("/my-learning?tab=external");
        toast.info("Для внешнего курса сначала создается заявка на согласование");
        return;
      }
      await api.enroll(course.id);
      await load();
      toast.success("Вы записаны на курс");
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось записаться";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function completeLesson(lessonId: string) {
    if (!track?.enrollment_id) return;
    setBusy(true);
    try {
      await api.completeLesson(track.enrollment_id, lessonId);
      await load();
      toast.success("Задание отмечено как выполненное");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось обновить прогресс");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !course) {
    return <AppShell title="Курс" subtitle="Загрузка карточки курса"><div className="card card-pad">Загрузка...</div></AppShell>;
  }

  return (
    <AppShell title={course.title} subtitle="Внутренний курс с модулями, заданиями и визуальным контролем дедлайнов">
      <div className="mb-4">
        <Link href="/courses" className="btn-secondary"><ArrowLeft className="mr-2 h-4 w-4" />Назад к курсам</Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
        <section className="card card-pad">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.course_type}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{course.title}</h1>
            </div>
            <StatusBadge status={course.status} />
          </div>

          <p className="mt-5 text-base leading-7 text-slate-600">{course.summary || course.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
            {course.provider_name ? <span>Провайдер: {course.provider_name}</span> : null}
            {course.level ? <span>· Уровень: {course.level}</span> : null}
            {course.delivery_mode ? <span>· Формат: {course.delivery_mode}</span> : null}
          </div>
          {course.provider_url ? <a href={course.provider_url} target="_blank" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600"><ExternalLink className="h-4 w-4" />Перейти к курсу / программе</a> : null}

          {track ? (
            <div className="mt-8 rounded-3xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div><div className="text-sm text-slate-500">Прогресс курса</div><div className="text-3xl font-semibold text-slate-900">{track.progress_percent}%</div></div>
                <div><div className="text-sm text-slate-500">Активные задания</div><div className="text-3xl font-semibold text-slate-900">{track.active_lessons}</div></div>
                <div><div className="text-sm text-slate-500">Просрочено</div><div className="text-3xl font-semibold text-rose-600">{track.overdue_lessons}</div></div>
              </div>
              <div className="mt-4 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-emerald-500" style={{ width: `${Math.max(track.progress_percent, 6)}%` }} /></div>
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            {track?.modules.map((module) => (
              <div key={module.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="font-semibold text-slate-900">{module.order_index}. {module.title}</div>
                <div className="mt-1 text-sm text-slate-500">{module.description}</div>
                <div className="mt-4 space-y-3">
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className={`rounded-2xl border p-4 ${deadlineStyles[lesson.deadline_status] || deadlineStyles.normal}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{lesson.order_index}. {lesson.title}</div>
                          <div className="mt-1 text-sm text-slate-600">{lesson.content}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {lesson.estimated_minutes || 20} мин</span>
                            <span>Дедлайн: {lesson.due_at ? formatDate(lesson.due_at) : "—"}</span>
                          </div>
                        </div>
                        {track.enrollment_id ? (
                          <button className={lesson.is_completed ? "btn-secondary" : "btn-primary"} disabled={busy || lesson.is_completed} onClick={() => completeLesson(lesson.id)}>
                            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : lesson.is_completed ? "Выполнено" : "Отметить готово"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <h3 className="text-lg font-bold text-slate-900">Действия</h3>
            <div className="mt-4 space-y-3">
              {myEnrollment ? (<div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">Вы уже записаны на курс. Статус: <span className="font-semibold">{myEnrollment.status}</span></div>) : null}
              <button onClick={handleEnroll} disabled={busy} className="btn-primary h-12 w-full">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : course.course_type === "internal" ? "Записаться и начать" : "Подать заявку"}</button>
              {course.course_type === "external" ? (<a href={course.provider_url || "/my-learning?tab=external"} target="_blank" className="btn-secondary h-12 w-full inline-flex items-center justify-center"><ExternalLink className="mr-2 h-4 w-4" />Перейти по ссылке курса</a>) : null}
            </div>
          </section>

          <section className="card card-pad">
            <h3 className="text-lg font-bold text-slate-900">Отзывы</h3>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? (<div className="rounded-3xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Пока нет отзывов. После завершения курса сотрудник сможет оставить оценку.</div>) : (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-center gap-1 text-amber-500">{Array.from({ length: review.rating }).map((_, index) => (<Star key={index} className="h-4 w-4 fill-current" />))}</div>
                    <p className="mt-2 text-sm text-slate-600">{review.comment || "Без комментария"}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-3 rounded-3xl bg-brand-50 p-4 text-brand-700"><CheckCircle2 className="h-5 w-5" /><p className="text-sm">После завершения всех заданий сертификат создаётся автоматически и попадает в профиль сотрудника.</p></div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
