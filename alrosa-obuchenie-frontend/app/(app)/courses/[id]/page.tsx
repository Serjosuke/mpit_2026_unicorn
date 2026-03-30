"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, LoaderCircle, Star } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, Enrollment, Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function CourseDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    Promise.all([api.getCourse(params.id), api.myEnrollments(), api.courseReviews(params.id)])
      .then(([course, enrollments, reviews]) => {
        setCourse(course);
        setEnrollments(enrollments);
        setReviews(reviews);
      })
      .catch((error) => {
        const message = error instanceof ApiError ? error.detail : "Не удалось загрузить курс";
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const myEnrollment = useMemo(
    () => enrollments.find((item) => item.course_id === course?.id),
    [course?.id, enrollments]
  );

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
      setEnrollments(await api.myEnrollments());
      toast.success("Вы записаны на курс");
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось записаться";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !course) {
    return (
      <AppShell title="Курс" subtitle="Загрузка карточки курса">
        <div className="card card-pad">
          <div className="skeleton h-8 w-52" />
          <div className="mt-4 skeleton h-5 w-full" />
          <div className="mt-2 skeleton h-5 w-3/4" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 p-5">
                <div className="skeleton h-5 w-24" />
                <div className="mt-4 skeleton h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={course.title} subtitle="Страница курса, запись на обучение и отзывы участников">
      <div className="mb-4">
        <Link href="/courses" className="btn-secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к курсам
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <section className="card card-pad">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.course_type}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{course.title}</h1>
            </div>
            <StatusBadge status={course.status} />
          </div>

          <p className="mt-5 text-base leading-7 text-slate-600">
            {course.description ||
              "Подробное описание пока не пришло из backend. Страница уже готова для подключения расширенного payload с модулями и уроками."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Тип</p>
              <div className="mt-2 text-lg font-semibold text-slate-900">{course.course_type === "internal" ? "Внутренний курс" : "Внешний курс"}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Статус</p>
              <div className="mt-2 text-lg font-semibold text-slate-900">{course.status}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Создан</p>
              <div className="mt-2 text-lg font-semibold text-slate-900">{formatDate(course.created_at)}</div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Что можно сделать сейчас</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• записаться на внутренний курс и начать прохождение</li>
              <li>• перейти к созданию заявки на внешний курс</li>
              <li>• посмотреть отзывы завершивших обучение сотрудников</li>
            </ul>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <h3 className="text-lg font-bold text-slate-900">Действия</h3>
            <div className="mt-4 space-y-3">
              {myEnrollment ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Вы уже записаны на курс. Статус: <span className="font-semibold">{myEnrollment.status}</span>
                </div>
              ) : null}
              <button onClick={handleEnroll} disabled={busy} className="btn-primary h-12 w-full">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : course.course_type === "internal" ? "Записаться и начать" : "Подать заявку"}
              </button>
              {course.course_type === "external" ? (
                <Link href="/my-learning?tab=external" className="btn-secondary h-12 w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Открыть раздел внешнего обучения
                </Link>
              ) : null}
            </div>
          </section>

          <section className="card card-pad">
            <h3 className="text-lg font-bold text-slate-900">Отзывы</h3>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Пока нет отзывов. После завершения курса сотрудник сможет оставить оценку.
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{review.comment || "Без комментария"}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-3 rounded-3xl bg-brand-50 p-4 text-brand-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm">
                После завершения внутреннего курса сертификат создаётся автоматически и попадает в профиль сотрудника.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
