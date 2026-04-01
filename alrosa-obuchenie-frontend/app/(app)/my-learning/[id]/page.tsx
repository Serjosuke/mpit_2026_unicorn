"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, CheckCircle2, Clock3, ExternalLink, LoaderCircle, Save, Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course, CourseTrack, Enrollment } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

const deadlineStyles: Record<string, string> = {
  normal: "border-slate-200 bg-white",
  warning: "border-amber-300 bg-amber-50",
  danger: "border-rose-300 bg-rose-50",
  done: "border-emerald-300 bg-emerald-50",
};

export default function MyLearningCoursePage() {
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [track, setTrack] = useState<CourseTrack | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progressDraft, setProgressDraft] = useState(0);
  const [certificateData, setCertificateData] = useState({ issuer_name: "", certificate_number: "", issue_date: "", file: null as File | null });

  async function load() {
    if (!params.id) return;
    setLoading(true);
    try {
      const [courseData, enrollmentsData, trackData] = await Promise.all([
        api.getCourse(params.id),
        api.myEnrollments(),
        api.courseTrack(params.id).catch(() => null),
      ]);
      setCourse(courseData);
      setEnrollments(enrollmentsData);
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

  const enrollment = useMemo(() => enrollments.find((item) => item.course_id === params.id), [enrollments, params.id]);
  const isExternal = course?.course_type === "external";
  const isCompleted = enrollment?.status === "completed";

  useEffect(() => {
    if (enrollment) {
      setProgressDraft(Math.min(Number(enrollment.progress_percent || 0), 99));
      setCertificateData((state) => ({
        ...state,
        issuer_name: state.issuer_name || course?.provider_name || "",
      }));
    }
  }, [enrollment?.id, enrollment?.progress_percent, course?.provider_name]);

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

  async function saveExternalProgress() {
    if (!enrollment) return;
    const nextProgress = Math.max(0, Math.min(99, Number.isFinite(progressDraft) ? Number(progressDraft) : 0));
    setBusy(true);
    try {
      const updated = await api.updateExternalProgress(enrollment.id, nextProgress);
      setProgressDraft(Math.min(Number(updated.progress_percent || 0), 99));
      setEnrollments((state) => state.map((item) => item.id === updated.id ? updated : item));
      toast.success("Прогресс внешнего курса обновлён");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось сохранить прогресс");
    } finally {
      setBusy(false);
    }
  }

  async function completeExternalCourse() {
    if (!enrollment) return;
    if (!certificateData.file) {
      toast.error("Чтобы завершить внешний курс, загрузите сертификат");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.completeExternalWithCertificate({
        enrollmentId: enrollment.id,
        issuer_name: certificateData.issuer_name,
        certificate_number: certificateData.certificate_number,
        issue_date: certificateData.issue_date || undefined,
        file: certificateData.file,
      });
      setEnrollments((state) => state.map((item) => item.id === updated.id ? updated : item));
      setProgressDraft(99);
      await load();
      toast.success("Внешний курс завершён, сертификат добавлен");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось завершить курс");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <AppShell title="Курс в обучении" subtitle="Загрузка курса"><div className="card card-pad">Загрузка...</div></AppShell>;
  }

  if (!course || !enrollment) {
    return (
      <AppShell title="Курс в обучении" subtitle="Этот курс пока не добавлен в ваш личный трек.">
        <div className="card card-pad space-y-4">
          <div className="text-sm text-slate-600">Курс не найден в разделе «Мои курсы».</div>
          <div className="flex flex-wrap gap-3">
            <Link href="/my-learning" className="btn-secondary"><ArrowLeft className="h-4 w-4" />Назад к моим курсам</Link>
            {params.id ? <Link href={`/courses/${params.id}`} className="btn-primary">Открыть карточку курса</Link> : null}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={course.title}
      subtitle={isExternal
        ? "Здесь можно менять прогресс внешнего курса и завершать его через сертификат."
        : "Здесь отображаются задания внутреннего курса и ваш фактический прогресс по ним."}
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Link href="/my-learning" className="btn-secondary"><ArrowLeft className="h-4 w-4" />Назад к моим курсам</Link>
        <Link href={`/courses/${course.id}`} className="btn-secondary">Открыть карточку из каталога</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="space-y-6">
          <div className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wide ${isExternal ? "text-emerald-700" : "text-brand-700"}`}>
                  {isExternal ? "Внешний курс в обучении" : "Внутренний курс в обучении"}
                </div>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{course.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{course.summary || course.description || "Описание курса."}</p>
              </div>
              <StatusBadge status={enrollment.status} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="panel-muted p-4">
                <div className="text-sm text-slate-500">Прогресс</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{Math.round(Number(enrollment.progress_percent || 0))}%</div>
              </div>
              <div className="panel-muted p-4">
                <div className="text-sm text-slate-500">Старт обучения</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{enrollment.started_at ? formatDate(enrollment.started_at) : "—"}</div>
              </div>
              <div className="panel-muted p-4">
                <div className="text-sm text-slate-500">Дедлайн</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{enrollment.target_completion_date ? formatDate(enrollment.target_completion_date) : "Не задан"}</div>
              </div>
            </div>

            <div className="mt-4 h-3 rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand-700" style={{ width: `${Math.max(Number(enrollment.progress_percent || 0), 4)}%` }} />
            </div>
          </div>

          {isExternal ? (
            <div className="card card-pad">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Управление внешним курсом</h3>
                  <p className="mt-1 text-sm text-slate-500">Изменять прогресс и завершать внешний курс можно только здесь, внутри раздела «Мои курсы».</p>
                </div>
                {isCompleted ? <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Курс завершён</div> : null}
              </div>

              {!isCompleted ? (
                <>
                  <div className="mt-5 rounded-[24px] border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">Ручной прогресс</div>
                        <div className="mt-1 text-sm text-slate-500">Укажите текущий процент прохождения курса у внешнего провайдера.</div>
                      </div>
                      <div className="text-lg font-bold text-slate-900">{progressDraft}%</div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px]">
                      <input type="range" min="0" max="99" value={progressDraft} onChange={(e) => setProgressDraft(Number(e.target.value))} />
                      <input className="input" type="number" min="0" max="99" value={progressDraft} onChange={(e) => setProgressDraft(Number(e.target.value))} />
                    </div>
                    <div className="mt-4">
                      <button className="btn-secondary" onClick={saveExternalProgress} disabled={busy}>
                        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Сохранить прогресс
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 p-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">Завершение курса</h4>
                      <p className="mt-1 text-sm text-slate-500">Чтобы завершить внешний курс, сначала добавьте сертификат. Без файла завершение недоступно.</p>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="label">Кем выдан</label>
                        <input className="input" value={certificateData.issuer_name} onChange={(e) => setCertificateData((state) => ({ ...state, issuer_name: e.target.value }))} placeholder="Например: Coursera" />
                      </div>
                      <div>
                        <label className="label">Номер сертификата</label>
                        <input className="input" value={certificateData.certificate_number} onChange={(e) => setCertificateData((state) => ({ ...state, certificate_number: e.target.value }))} placeholder="Опционально" />
                      </div>
                      <div>
                        <label className="label">Дата выдачи</label>
                        <input className="input" type="date" value={certificateData.issue_date} onChange={(e) => setCertificateData((state) => ({ ...state, issue_date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Файл сертификата</label>
                        <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 text-sm text-slate-600 hover:border-brand-400 hover:text-brand-700">
                          <Upload className="h-4 w-4" />
                          <span className="truncate">{certificateData.file?.name || "Выбрать PDF / PNG / JPG"}</span>
                          <input className="hidden" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setCertificateData((state) => ({ ...state, file: e.target.files?.[0] || null }))} />
                        </label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="btn-primary" onClick={completeExternalCourse} disabled={busy || !certificateData.file}>
                        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}Завершить курс
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-[24px] bg-emerald-50 p-4 text-sm text-emerald-700">
                  Курс уже завершён. Сертификат добавлен в систему, прогресс зафиксирован как 100%.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card card-pad">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Задания курса</h3>
                    <p className="mt-1 text-sm text-slate-500">Внутренний курс завершится автоматически, когда будут выполнены все задания.</p>
                  </div>
                  {track ? (
                    <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                      Выполнено {track.completed_lessons} из {track.completed_lessons + track.active_lessons}
                    </div>
                  ) : null}
                </div>
              </div>

              {track?.modules.map((module) => (
                <div key={module.id} className="card card-pad">
                  <h3 className="text-xl font-bold text-slate-900">{module.order_index}. {module.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{module.description || "Практический модуль курса."}</p>
                  <div className="mt-5 space-y-3">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className={`rounded-[20px] border p-4 ${deadlineStyles[lesson.deadline_status] || deadlineStyles.normal}`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-slate-900">{lesson.order_index}. {lesson.title}</div>
                            <div className="mt-1 text-sm text-slate-600">{lesson.content}</div>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{lesson.estimated_minutes || 20} мин</span>
                              <span>Дедлайн: {lesson.due_at ? formatDateTime(lesson.due_at) : "—"}</span>
                            </div>
                          </div>
                          <button className={lesson.is_completed ? "btn-secondary" : "btn-primary"} disabled={busy || lesson.is_completed || isCompleted} onClick={() => completeLesson(lesson.id)}>
                            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : lesson.is_completed ? "Выполнено" : "Отметить готово"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <h3 className="text-lg font-bold text-slate-900">Состояние обучения</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-[20px] border border-slate-200 p-4 text-sm text-slate-600">
                <div className="font-medium text-slate-900">Статус</div>
                <div className="mt-1">{enrollment.status}</div>
              </div>
              <div className="rounded-[20px] border border-slate-200 p-4 text-sm text-slate-600">
                <div className="font-medium text-slate-900">Провайдер</div>
                <div className="mt-1">{course.provider_name || "ALROSA Academy"}</div>
              </div>
              {enrollment.completed_at ? (
                <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Курс завершён {formatDateTime(enrollment.completed_at)}
                </div>
              ) : null}
              {course.provider_url ? (
                <a href={course.provider_url} target="_blank" rel="noreferrer" className="btn-secondary w-full">
                  <ExternalLink className="h-4 w-4" />Открыть курс у провайдера
                </a>
              ) : null}
              <Link href="/certificates" className="btn-primary w-full">
                <CheckCircle2 className="h-4 w-4" />Мои сертификаты
              </Link>
            </div>
          </section>

          <section className="card card-pad">
            <div className="rounded-[20px] bg-brand-50 p-4 text-sm text-brand-700">
              Здесь находится рабочая карточка курса из раздела «Мои курсы». Только на этой странице можно менять прогресс, закрывать задания и завершать курс.
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
