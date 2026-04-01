"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpenCheck, ExternalLink, LoaderCircle, Star } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, CourseTrack, Enrollment, Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
      const [courseData, enrollmentsData, reviewsData, trackData] = await Promise.all([
        api.getCourse(params.id),
        api.myEnrollments(),
        api.courseReviews(params.id),
        api.courseTrack(params.id).catch(() => null),
      ]);
      setCourse(courseData);
      setEnrollments(enrollmentsData);
      setReviews(reviewsData);
      setTrack(trackData);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить курс");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  const myEnrollment = useMemo(() => enrollments.find((item) => item.course_id === course?.id), [course?.id, enrollments]);
  const isCompleted = myEnrollment?.status === "completed";
  const isStarted = !!myEnrollment && myEnrollment.status !== "completed";

  async function handleEnroll() {
    if (!course) return;
    setBusy(true);
    try {
      if (course.course_type === "external") {
        router.push("/courses?tab=external");
        toast.info("Для внешнего курса отправь заявку на одобрение или дождись назначения от HR");
        return;
      }
      await api.enroll(course.id);
      await load();
      toast.success("Вы записаны на курс");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось записаться");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !course) {
    return <AppShell title="Курс" subtitle="Загрузка страницы курса"><div className="card card-pad">Загрузка...</div></AppShell>;
  }

  return (
    <AppShell
      title={course.title}
      subtitle={course.course_type === "internal"
        ? "Карточка курса в каталоге: здесь только описание, структура и запись на обучение."
        : "Карточка внешнего курса в каталоге: описание, ссылка на провайдера и статусы участия."}
    >
      <div className="mb-4">
        <Link href="/courses" className="btn-secondary"><ArrowLeft className="h-4 w-4" />Назад в каталог</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="space-y-6">
          <div className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wide ${course.course_type === "external" ? "text-emerald-700" : "text-brand-700"}`}>
                  {course.course_type === "internal" ? "Внутренний курс" : "Внешний курс"}
                </div>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{course.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{course.summary || course.description || "Описание курса."}</p>
              </div>
              <StatusBadge status={course.status} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
              {course.provider_name ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.provider_name}</span> : null}
              {course.level ? <span className="rounded-full bg-slate-100 px-3 py-1">Уровень: {course.level}</span> : null}
              {course.delivery_mode ? <span className="rounded-full bg-slate-100 px-3 py-1">Формат: {course.delivery_mode}</span> : null}
              {course.duration_hours ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.duration_hours} ч</span> : null}
              {typeof course.active_enrollments_count === "number" ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Сейчас проходят: {course.active_enrollments_count}</span> : null}
              {typeof course.total_enrollments_count === "number" ? <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">Записано: {course.total_enrollments_count}</span> : null}
              <span className="rounded-full bg-slate-100 px-3 py-1">Добавлен: {formatDate(course.created_at)}</span>
            </div>

            {course.provider_url ? (
              <a href={course.provider_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline">
                <ExternalLink className="h-4 w-4" />Открыть страницу курса
              </a>
            ) : null}
          </div>

          {course.course_type === "internal" && track ? (
            <div className="card card-pad">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Структура курса</h3>
                  <p className="mt-1 text-sm text-slate-500">В каталоге показана программа курса. Отмечать выполнение заданий можно только внутри раздела «Мои курсы».</p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{track.modules.length} модулей</div>
              </div>
              <div className="mt-5 space-y-4">
                {track.modules.map((module) => (
                  <div key={module.id} className="rounded-[24px] border border-slate-200 p-4">
                    <div className="text-lg font-semibold text-slate-900">{module.order_index}. {module.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{module.description || "Практический модуль курса."}</div>
                    <div className="mt-4 space-y-3">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="rounded-[20px] bg-slate-50 p-4">
                          <div className="font-medium text-slate-900">{lesson.order_index}. {lesson.title}</div>
                          <div className="mt-1 text-sm text-slate-500">{lesson.content || "Описание будет доступно после старта обучения."}</div>
                          <div className="mt-2 text-xs text-slate-500">Оценка времени: {lesson.estimated_minutes || 20} мин</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card card-pad">
              <h3 className="text-xl font-bold text-slate-900">О курсе</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="panel-muted p-4"><div className="text-sm text-slate-500">Формат</div><div className="mt-1 text-base font-semibold text-slate-900">{course.delivery_mode || "Онлайн"}</div></div>
                <div className="panel-muted p-4"><div className="text-sm text-slate-500">Длительность</div><div className="mt-1 text-base font-semibold text-slate-900">{course.duration_hours ? `${course.duration_hours} часов` : "Нужно уточнить"}</div></div>
                <div className="panel-muted p-4"><div className="text-sm text-slate-500">Источник</div><div className="mt-1 text-base font-semibold text-slate-900">{course.provider_name || "Внешний провайдер"}</div></div>
                <div className="panel-muted p-4"><div className="text-sm text-slate-500">Назначение</div><div className="mt-1 text-base font-semibold text-slate-900">Подробнее и прогресс доступны в «Моих курсах»</div></div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <h3 className="text-lg font-bold text-slate-900">Действия</h3>
            <div className="mt-4 space-y-3">
              {myEnrollment ? (
                <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Курс уже находится в вашем обучении. Статус: <span className="font-semibold">{myEnrollment.status}</span>
                </div>
              ) : null}

              {!myEnrollment ? (
                <button className="btn-primary h-12 w-full" onClick={handleEnroll} disabled={busy}>
                  {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : course.course_type === "internal" ? "Записаться на курс" : "Перейти к внешнему поиску"}
                </button>
              ) : (
                <Link href={`/my-learning/${course.id}`} className="btn-primary h-12 w-full">
                  <BookOpenCheck className="h-4 w-4" />
                  {isCompleted ? "Открыть завершённый курс" : isStarted ? "Открыть курс в моём обучении" : "Перейти к курсу"}
                </Link>
              )}

              {course.provider_url ? (
                <a href={course.provider_url} target="_blank" rel="noreferrer" className="btn-secondary h-12 w-full">
                  <ExternalLink className="h-4 w-4" />Открыть внешний курс
                </a>
              ) : null}
            </div>
          </section>

          <section className="card card-pad">
            <h3 className="text-lg font-bold text-slate-900">Отзывы</h3>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? <div className="panel-muted p-4 text-sm text-slate-500">Пока отзывов нет.</div> : reviews.map((review) => (
                <div key={review.id} className="rounded-[20px] border border-slate-200 p-4">
                  <div className="flex items-center gap-1 text-amber-500">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div>
                  <p className="mt-2 text-sm text-slate-600">{review.comment || "Без комментария"}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card card-pad">
            <div className="rounded-[20px] bg-brand-50 p-4 text-sm text-brand-700">
              Важно: карточка курса в каталоге и карточка курса в «Моих курсах» разделены. Управление прогрессом, выполнение уроков и завершение курса доступны только внутри вашего трека обучения.
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
