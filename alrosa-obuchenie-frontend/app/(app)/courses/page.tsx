"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search, Sparkles, Star, Send, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { StatusBadge } from "@/components/common/status-badge";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api";
import type { Course, SmartCourseResult, User } from "@/lib/types";

export default function CoursesPage() {
  const { user } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("React-разработчик");
  const [results, setResults] = useState<SmartCourseResult[]>([]);
  const [smartLoading, setSmartLoading] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [justification, setJustification] = useState("Этот курс нужен для развития моей роли и рабочих задач.");
  const isHR = user?.role === "hr" || user?.role === "admin";
  const isEmployee = user?.role === "employee";

  async function loadBase() {
    setLoading(true);
    try {
      const [courseData, userData] = await Promise.all([api.listCourses(), isHR ? api.listUsers() : Promise.resolve([] as User[])]);
      setCourses(courseData);
      const employees = userData.filter((item) => item.role === "employee");
      setUsers(employees);
      if (employees.length && selectedEmployeeIds.length === 0) setSelectedEmployeeIds([employees[0].id]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить каталог");
    } finally {
      setLoading(false);
    }
  }

  async function runSearch(currentQuery = searchQuery) {
    if (currentQuery.trim().length < 2) return;
    setSmartLoading(true);
    try {
      const data = await api.externalSearchCourses(currentQuery);
      setResults(data.results);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось выполнить поиск");
    } finally {
      setSmartLoading(false);
    }
  }

  useEffect(() => { void loadBase(); }, [isHR]);
  useEffect(() => { const d = new Date(); d.setDate(d.getDate() + 21); setDueDate(d.toISOString().slice(0, 10)); }, []);
  useEffect(() => { void runSearch(searchQuery); }, []);

  const filtered = useMemo(() => courses.filter((course) => {
    const matchesQuery = [course.title, course.description || "", course.summary || "", course.skill_tags || "", course.provider_name || ""].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesType = type === "all" || course.course_type === type;
    return matchesQuery && matchesType;
  }), [courses, query, type]);

  function toggleEmployee(id: string) {
    setSelectedEmployeeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function favoriteResult(result: SmartCourseResult) {
    try {
      await api.favoriteExternalCourse({
        title: result.title, provider_name: result.provider_name, provider_url: result.provider_url, summary: result.summary, description: result.description, level: result.level, delivery_mode: result.delivery_mode, duration_hours: result.duration_hours, price_amount: result.price_amount, price_currency: result.price_currency, skill_tags: result.tags.join(", "),
      });
      toast.success("Курс добавлен в избранное HR и будет подниматься выше в поиске");
      await loadBase();
      await runSearch(searchQuery);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось добавить в избранное");
    }
  }

  async function assignResult(result: SmartCourseResult) {
    if (selectedEmployeeIds.length === 0) return toast.error("Выбери хотя бы одного сотрудника");
    if (!dueDate) return toast.error("Укажи срок выполнения");
    try {
      if (selectedEmployeeIds.length === 1) {
        const response = await api.assignExternalCourse({ employee_id: selectedEmployeeIds[0], title: result.title, provider_name: result.provider_name, provider_url: result.provider_url || "https://example.com", summary: result.summary || result.why_recommended, description: result.description || result.summary || undefined, level: result.level || undefined, delivery_mode: result.delivery_mode || "online", duration_hours: result.duration_hours || undefined, due_date: dueDate, price_amount: result.price_amount || undefined, price_currency: result.price_currency || "RUB" });
        toast.success(response.conflict_handled_as_reminder ? "Курс назначен, в календарь добавлено напоминание" : "Курс назначен сотруднику");
      } else {
        const response = await api.assignExternalCourseBulk({ user_ids: selectedEmployeeIds, title: result.title, provider_name: result.provider_name, provider_url: result.provider_url || "https://example.com", summary: result.summary || result.why_recommended, description: result.description || result.summary || undefined, level: result.level || undefined, delivery_mode: result.delivery_mode || "online", duration_hours: result.duration_hours || undefined, due_date: dueDate, price_amount: result.price_amount || undefined, price_currency: result.price_currency || "RUB" });
        toast.success(`Назначено: ${response.created}. Напоминаний из-за конфликтов: ${response.reminders}`);
      }
      await loadBase();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось назначить курс");
    }
  }

  async function submitForReview(result: SmartCourseResult) {
    try {
      await api.createExternalRequest({
        title: result.title, provider_name: result.provider_name, provider_url: result.provider_url, program_description: result.description || result.summary || "", justification, cost_amount: result.price_amount || 0, cost_currency: result.price_currency || "RUB", requested_start_date: dueDate || undefined, requested_end_date: dueDate || undefined, estimated_duration_hours: result.duration_hours || undefined, budget_code: null,
      });
      toast.success("Заявка отправлена на рассмотрение");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось отправить заявку");
    }
  }

  return (
    <AppShell title="Курсы и внешний поиск" subtitle="Единый поиск внутренних и внешних курсов. HR может рекомендовать и назначать, сотрудник — подавать курс на рассмотрение.">
      {loading ? <PageLoader /> : <>
        <section className="card card-pad mb-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Поиск внешних курсов</h3>
              <p className="mt-1 text-sm text-slate-500">Ищи курсы по ролям: менеджер, спикер, фронтенд, бэкенд, Android, аналитик, DevOps и другим. Если подключен OpenAI API key, поиск идет через Responses API и web search. Иначе включается резервный каталог.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_220px_auto]">
            <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Например: фронтенд, java middle, менеджер, soft skills" /></div>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <button className="btn-primary" onClick={() => runSearch()} disabled={smartLoading}>{smartLoading ? "Ищем..." : "Найти"}</button>
          </div>

          {isHR ? <div className="mt-4 rounded-3xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Users className="h-4 w-4" />Сотрудники для назначения</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {users.map((employee) => <label key={employee.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${selectedEmployeeIds.includes(employee.id) ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}>
                <input type="checkbox" checked={selectedEmployeeIds.includes(employee.id)} onChange={() => toggleEmployee(employee.id)} />
                <span className="text-sm">{employee.last_name} {employee.first_name}<span className="block text-xs text-slate-500">{employee.position_title || "Сотрудник"}</span></span>
              </label>)}
            </div>
          </div> : null}

          {isEmployee ? <div className="mt-4 rounded-3xl border border-slate-200 p-4">
            <label className="label">Зачем тебе курс</label>
            <textarea className="input min-h-[96px]" value={justification} onChange={(e) => setJustification(e.target.value)} />
          </div> : null}

          <div className="mt-5 space-y-3">
            {results.map((result) => (
              <div key={`${result.source_type}-${result.title}-${result.provider_name}`} className={`rounded-[28px] border p-5 ${result.is_internal_priority ? "border-brand-200 bg-brand-50/40" : result.is_recommended ? "border-amber-300 bg-amber-50/40" : "border-slate-200"}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.is_internal_priority ? "bg-brand-100 text-brand-700" : result.is_recommended ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{result.is_internal_priority ? "Внутренний приоритет" : result.is_recommended ? "Рекомендовано HR" : "Внешний курс"}</span>
                      {result.level ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{result.level}</span> : null}
                      {result.delivery_mode ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{result.delivery_mode}</span> : null}
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">{result.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{result.provider_name} · {result.freshness_label || "поиск"}</p>
                    <p className="mt-3 text-sm text-slate-600">{result.summary || result.description}</p>
                    <p className="mt-3 text-sm text-brand-700">{result.why_recommended}</p>
                    <div className="mt-3 flex flex-wrap gap-2">{result.tags?.map((tag) => <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">{tag}</span>)}</div>
                  </div>
                  <div className="flex min-w-[240px] flex-col gap-3">
                    {result.provider_url ? <a className="btn-secondary" href={result.provider_url} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Открыть курс</a> : null}
                    {result.is_internal_priority && result.course_id ? <Link href={`/courses/${result.course_id}`} className="btn-primary">Открыть внутренний курс</Link> : null}
                    {isHR && !result.is_internal_priority ? <button className="btn-secondary" onClick={() => favoriteResult(result)}><Star className="mr-2 h-4 w-4" />В избранное HR</button> : null}
                    {isHR && !result.is_internal_priority ? <button className="btn-primary" onClick={() => assignResult(result)}><Users className="mr-2 h-4 w-4" />Назначить</button> : null}
                    {isEmployee && !result.is_internal_priority ? <button className="btn-primary" onClick={() => submitForReview(result)}><Send className="mr-2 h-4 w-4" />Подать на рассмотрение</button> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card card-pad">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-11" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по внутреннему каталогу компании" /></div>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="all">Все типы</option><option value="internal">Внутренние</option><option value="external">Внешние</option></select>
          </div>

          {filtered.length === 0 ? <EmptyState title="Курсы не найдены" description="Попробуй другой запрос или открой внешний поиск выше." /> : <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filtered.map((course) => <article key={course.id} className="flex h-full flex-col rounded-[32px] border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.course_type}</p>{course.is_featured_internal ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">Рекомендовано HR</span> : null}</div>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{course.title}</h3>
                </div>
                <StatusBadge status={course.status} />
              </div>
              <p className="mt-4 flex-1 text-sm text-slate-500">{course.summary || course.description || "Доступный курс для развития компетенций."}</p>
              <div className="mt-3 flex flex-wrap gap-2">{course.skill_tags?.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 4).map((tag) => <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">{tag}</span>)}</div>
              <div className="mt-5 flex items-center justify-between gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{course.course_type === "external" ? "Внешний / по ссылке" : course.delivery_mode === "offline" ? "Групповые офлайн-сессии" : "Внутренний курс"}</span><Link href={`/courses/${course.id}`} className="btn-primary">Подробнее</Link></div>
            </article>)}
          </div>}
        </section>
      </>}
    </AppShell>
  );
}
