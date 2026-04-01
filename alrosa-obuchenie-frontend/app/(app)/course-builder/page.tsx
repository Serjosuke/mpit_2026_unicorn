"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Layers3, LoaderCircle, Plus, Send, Trash2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api";
import type { Course, ManagerCourseDraftInput } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const initialForm: ManagerCourseDraftInput = {
  title: "",
  summary: "",
  description: "",
  skill_tags: "",
  level: "middle",
  delivery_mode: "online",
  duration_hours: 16,
  provider_name: "ALROSA LearnFlow",
  modules: [
    {
      title: "Введение",
      description: "Базовый блок курса",
      lessons: [
        { title: "Старт курса", content: "Ознакомление с целями и ожидаемым результатом", estimated_minutes: 25 },
      ],
    },
  ],
  sessions: [],
};

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

export default function CourseBuilderPage() {
  const { user } = useApp();
  const [form, setForm] = useState<ManagerCourseDraftInput>(initialForm);
  const [sessionDraft, setSessionDraft] = useState({ title: "Сессия 1", date: "", start: "10:00", end: "11:30", location: "", meeting_url: "" });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const items = await api.listCourses();
      setCourses(items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить конструктор");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const myDrafts = useMemo(
    () => courses.filter((course) => course.course_type === "internal" && course.created_by === user?.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
    [courses, user?.id]
  );

  if (user?.role !== "manager" && user?.role !== "admin" && user?.role !== "hr") {
    return (
      <AppShell title="Конструктор курса" subtitle="Этот раздел доступен менеджеру, HR и администратору.">
        <div className="card card-pad text-sm text-slate-500">Недостаточно прав для открытия конструктора курса.</div>
      </AppShell>
    );
  }

  function updateModule(index: number, patch: Partial<ManagerCourseDraftInput["modules"][number]>) {
    setForm((state) => ({
      ...state,
      modules: state.modules.map((module, moduleIndex) => moduleIndex === index ? { ...module, ...patch } : module),
    }));
  }

  function updateLesson(moduleIndex: number, lessonIndex: number, patch: Partial<ManagerCourseDraftInput["modules"][number]["lessons"][number]>) {
    setForm((state) => ({
      ...state,
      modules: state.modules.map((module, index) => index !== moduleIndex ? module : {
        ...module,
        lessons: module.lessons.map((lesson, idx) => idx === lessonIndex ? { ...lesson, ...patch } : lesson),
      }),
    }));
  }

  function addModule() {
    setForm((state) => ({
      ...state,
      modules: [...state.modules, { title: `Раздел ${state.modules.length + 1}`, description: "", lessons: [{ title: "Новый урок", content: "", estimated_minutes: 20 }] }],
    }));
  }

  function addLesson(moduleIndex: number) {
    setForm((state) => ({
      ...state,
      modules: state.modules.map((module, index) => index !== moduleIndex ? module : {
        ...module,
        lessons: [...module.lessons, { title: `Урок ${module.lessons.length + 1}`, content: "", estimated_minutes: 20 }],
      }),
    }));
  }

  function removeModule(moduleIndex: number) {
    setForm((state) => ({ ...state, modules: state.modules.filter((_, index) => index !== moduleIndex) }));
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    setForm((state) => ({
      ...state,
      modules: state.modules.map((module, index) => index !== moduleIndex ? module : {
        ...module,
        lessons: module.lessons.filter((_, idx) => idx !== lessonIndex),
      }),
    }));
  }

  function addSession() {
    if (!sessionDraft.date) {
      toast.error("Укажите дату проведения");
      return;
    }
    setForm((state) => ({
      ...state,
      sessions: [
        ...state.sessions,
        {
          title: sessionDraft.title,
          starts_at: toIso(sessionDraft.date, sessionDraft.start),
          ends_at: toIso(sessionDraft.date, sessionDraft.end),
          location: sessionDraft.location || null,
          meeting_url: sessionDraft.meeting_url || null,
        },
      ],
    }));
    setSessionDraft((state) => ({ ...state, title: `Сессия ${form.sessions.length + 2}`, date: "", location: "", meeting_url: "" }));
  }

  function removeSession(index: number) {
    setForm((state) => ({ ...state, sessions: state.sessions.filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function submit() {
    if (!form.title.trim()) {
      toast.error("Введите название курса");
      return;
    }
    if (form.modules.length === 0 || form.modules.some((module) => module.lessons.length === 0)) {
      toast.error("В каждом разделе должен быть хотя бы один урок");
      return;
    }
    setSaving(true);
    try {
      await api.createManagerDraftCourse({
        ...form,
        duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
      });
      toast.success("Курс отправлен HR на подтверждение");
      setForm(initialForm);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось отправить курс");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Конструктор курса" subtitle="Менеджер собирает программу, указывает формат, дни проведения и разделы, после чего отправляет курс HR на подтверждение.">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="card card-pad">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"><WandSparkles className="h-3.5 w-3.5" />Новый внутренний курс</div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Соберите курс для команды</h2>
                <p className="mt-2 text-sm text-slate-500">После отправки курс попадёт HR на согласование. После подтверждения он появится во внутренних курсах и станет доступен сотрудникам.</p>
              </div>
              <button className="btn-primary" onClick={submit} disabled={saving}>
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Отправить HR
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><label className="label">Название курса</label><input className="input" value={form.title} onChange={(e) => setForm((state) => ({ ...state, title: e.target.value }))} placeholder="Например: Управление производственной сменой" /></div>
              <div><label className="label">Формат</label><select className="input" value={form.delivery_mode} onChange={(e) => setForm((state) => ({ ...state, delivery_mode: e.target.value }))}><option value="online">Онлайн</option><option value="offline">Очно</option><option value="hybrid">Смешанный</option></select></div>
              <div><label className="label">Уровень</label><select className="input" value={form.level || "middle"} onChange={(e) => setForm((state) => ({ ...state, level: e.target.value }))}><option value="junior">junior</option><option value="middle">middle</option><option value="senior">senior</option><option value="expert">expert</option></select></div>
              <div><label className="label">Провайдер / владелец</label><input className="input" value={form.provider_name || ""} onChange={(e) => setForm((state) => ({ ...state, provider_name: e.target.value }))} /></div>
              <div><label className="label">Часы</label><input className="input" type="number" min="1" value={form.duration_hours || 0} onChange={(e) => setForm((state) => ({ ...state, duration_hours: Number(e.target.value) }))} /></div>
              <div className="md:col-span-2"><label className="label">Краткое описание</label><textarea className="input h-28 py-3" value={form.summary || ""} onChange={(e) => setForm((state) => ({ ...state, summary: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">Полное описание</label><textarea className="input h-32 py-3" value={form.description || ""} onChange={(e) => setForm((state) => ({ ...state, description: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">Теги / навыки</label><input className="input" value={form.skill_tags || ""} onChange={(e) => setForm((state) => ({ ...state, skill_tags: e.target.value }))} placeholder="управление, коммуникация, безопасность" /></div>
            </div>
          </div>

          <div className="card card-pad">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Разделы курса</h3>
                <p className="mt-1 text-sm text-slate-500">Разбейте программу на логические блоки и заполните уроки внутри каждого раздела.</p>
              </div>
              <button className="btn-secondary" onClick={addModule}><Plus className="h-4 w-4" />Добавить раздел</button>
            </div>
            <div className="mt-5 space-y-4">
              {form.modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="rounded-[24px] border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="label">Раздел {moduleIndex + 1}</label>
                      <input className="input" value={module.title} onChange={(e) => updateModule(moduleIndex, { title: e.target.value })} />
                      <textarea className="input mt-3 h-24 py-3" value={module.description || ""} onChange={(e) => updateModule(moduleIndex, { description: e.target.value })} placeholder="Краткое описание раздела" />
                    </div>
                    <button className="btn-danger" onClick={() => removeModule(moduleIndex)} disabled={form.modules.length === 1}><Trash2 className="h-4 w-4" />Удалить</button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="rounded-[20px] bg-slate-50 p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                          <input className="input" value={lesson.title} onChange={(e) => updateLesson(moduleIndex, lessonIndex, { title: e.target.value })} placeholder="Название урока" />
                          <input className="input" type="number" min="5" value={lesson.estimated_minutes || 20} onChange={(e) => updateLesson(moduleIndex, lessonIndex, { estimated_minutes: Number(e.target.value) })} />
                          <button className="btn-secondary" onClick={() => removeLesson(moduleIndex, lessonIndex)} disabled={module.lessons.length === 1}><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <textarea className="input mt-3 h-24 py-3" value={lesson.content || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, { content: e.target.value })} placeholder="Содержание, задание или комментарий к уроку" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4"><button className="btn-secondary" onClick={() => addLesson(moduleIndex)}><Plus className="h-4 w-4" />Добавить урок</button></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Дни проведения</h3>
                <p className="mt-1 text-sm text-slate-500">Добавьте очные или онлайн-сессии. Эти даты потом смогут попадать сотрудникам в календарь.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-6">
              <input className="input lg:col-span-2" value={sessionDraft.title} onChange={(e) => setSessionDraft((state) => ({ ...state, title: e.target.value }))} placeholder="Название сессии" />
              <input className="input" type="date" value={sessionDraft.date} onChange={(e) => setSessionDraft((state) => ({ ...state, date: e.target.value }))} />
              <input className="input" type="time" value={sessionDraft.start} onChange={(e) => setSessionDraft((state) => ({ ...state, start: e.target.value }))} />
              <input className="input" type="time" value={sessionDraft.end} onChange={(e) => setSessionDraft((state) => ({ ...state, end: e.target.value }))} />
              <button className="btn-primary" onClick={addSession}><Plus className="h-4 w-4" />Добавить</button>
              <input className="input lg:col-span-3" value={sessionDraft.location} onChange={(e) => setSessionDraft((state) => ({ ...state, location: e.target.value }))} placeholder="Локация для очного курса" />
              <input className="input lg:col-span-3" value={sessionDraft.meeting_url} onChange={(e) => setSessionDraft((state) => ({ ...state, meeting_url: e.target.value }))} placeholder="Ссылка на онлайн-встречу" />
            </div>
            <div className="mt-5 space-y-3">
              {form.sessions.map((session, index) => (
                <div key={`${session.title}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 p-4 text-sm text-slate-600">
                  <div>
                    <div className="font-semibold text-slate-900">{session.title}</div>
                    <div className="mt-1">{formatDate(session.starts_at)} · {new Date(session.starts_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} – {new Date(session.ends_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="mt-1">{session.location || session.meeting_url || "Формат будет уточнён позже"}</div>
                  </div>
                  <button className="btn-secondary" onClick={() => removeSession(index)}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {form.sessions.length === 0 ? <div className="rounded-[20px] bg-slate-50 p-4 text-sm text-slate-500">Сессии пока не добавлены. Для полностью асинхронного курса это необязательно.</div> : null}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <div className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-brand-700" /><h3 className="text-lg font-bold">Итог курса</h3></div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-[20px] bg-slate-50 p-4">Разделов: <span className="font-semibold text-slate-900">{form.modules.length}</span></div>
              <div className="rounded-[20px] bg-slate-50 p-4">Уроков: <span className="font-semibold text-slate-900">{form.modules.reduce((acc, module) => acc + module.lessons.length, 0)}</span></div>
              <div className="rounded-[20px] bg-slate-50 p-4">Сессий: <span className="font-semibold text-slate-900">{form.sessions.length}</span></div>
              <div className="rounded-[20px] bg-slate-50 p-4">Формат: <span className="font-semibold text-slate-900">{form.delivery_mode}</span></div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-slate-700" /><h3 className="text-lg font-bold">Мои отправленные курсы</h3></div>
            <div className="mt-4 space-y-3">
              {loading ? <div className="panel-muted p-4 text-sm text-slate-500">Загрузка...</div> : myDrafts.map((course) => (
                <div key={course.id} className="rounded-[20px] border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{course.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{course.delivery_mode || "online"} · {course.duration_hours ? `${course.duration_hours} ч` : "без оценки"}</div>
                    </div>
                    <StatusBadge status={course.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {typeof course.active_enrollments_count === "number" ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Проходят: {course.active_enrollments_count}</span> : null}
                    {typeof course.total_enrollments_count === "number" ? <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">Записано: {course.total_enrollments_count}</span> : null}
                  </div>
                </div>
              ))}
              {!loading && myDrafts.length === 0 ? <EmptyState title="Пока нет отправленных курсов" description="После отправки курс появится здесь со статусом согласования." /> : null}
            </div>
          </section>

          <section className="card card-pad">
            <div className="rounded-[20px] bg-brand-50 p-4 text-sm text-brand-700">
              После подтверждения HR курс автоматически появится в разделе внутренних курсов и сотрудники смогут записываться на него.
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/courses?tab=internal" className="btn-secondary"><CheckCircle2 className="h-4 w-4" />Каталог внутренних курсов</Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
