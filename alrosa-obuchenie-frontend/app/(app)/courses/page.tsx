"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search, Sparkles, Star, Send, Users, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { StatusBadge } from "@/components/common/status-badge";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api";
import type { Course, Department, SmartCourseResult, User } from "@/lib/types";

const difficultyLabel: Record<string, string> = {
  easy: "Легкий",
  medium: "Средний",
  hard: "Сложный",
};

export default function CoursesPage() {
  const { user } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("frontend react");
  const [results, setResults] = useState<SmartCourseResult[]>([]);
  const [smartLoading, setSmartLoading] = useState(false);
  const [sendingRequestKey, setSendingRequestKey] = useState<string | null>(null);
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const [searchSort, setSearchSort] = useState("ai");
  const [selectedCourse, setSelectedCourse] = useState<SmartCourseResult | null>(null);
  const [assignCourse, setAssignCourse] = useState<SmartCourseResult | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [justification, setJustification] = useState("Этот курс нужен мне для рабочих задач и развития по роли.");
  const isHR = user?.role === "hr" || user?.role === "admin";
  const isEmployee = user?.role === "employee";

  async function loadBase() {
    setLoading(true);
    try {
      const [courseData, userData, departmentData] = await Promise.all([
        api.listCourses(),
        isHR ? api.listUsers() : Promise.resolve([] as User[]),
        isHR ? api.listDepartments() : Promise.resolve([] as Department[]),
      ]);
      setCourses(courseData);
      setUsers(userData.filter((item) => item.role === "employee"));
      setDepartments(departmentData);
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

  const sortedResults = useMemo(() => {
    const items = [...results];
    const difficultyScore = (value?: string | null) => value === "hard" ? 3 : value === "medium" ? 2 : value === "easy" ? 1 : 0;
    items.sort((a, b) => {
      if (searchSort === "price") return (a.price_amount ?? Number.MAX_SAFE_INTEGER) - (b.price_amount ?? Number.MAX_SAFE_INTEGER);
      if (searchSort === "course_rating") return (b.average_rating ?? 0) - (a.average_rating ?? 0);
      if (searchSort === "difficulty") return difficultyScore(b.difficulty) - difficultyScore(a.difficulty);
      return (b.ai_rating ?? b.score ?? 0) - (a.ai_rating ?? a.score ?? 0);
    });
    return items;
  }, [results, searchSort]);

  const selectedTargetUserIds = useMemo(() => {
    const departmentUsers = users.filter((item) => item.department_id && selectedDepartmentIds.includes(item.department_id)).map((item) => item.id);
    return Array.from(new Set([...selectedEmployeeIds, ...departmentUsers]));
  }, [selectedDepartmentIds, selectedEmployeeIds, users]);

  function toggleEmployee(id: string) {
    setSelectedEmployeeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleDepartment(id: string) {
    setSelectedDepartmentIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function favoriteResult(result: SmartCourseResult) {
    try {
      await api.favoriteExternalCourse({
        title: result.title,
        provider_name: result.provider_name,
        provider_url: result.provider_url,
        summary: result.summary,
        description: result.description,
        level: result.level,
        delivery_mode: result.delivery_mode,
        duration_hours: result.duration_hours,
        price_amount: result.price_amount,
        price_currency: result.price_currency,
        skill_tags: result.tags.join(", "),
      });
      toast.success("Курс добавлен в рекомендации HR");
      await loadBase();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось добавить в избранное");
    }
  }

  async function submitForReview(result: SmartCourseResult) {
    const key = `${result.title}-${result.provider_name}`;
    setSendingRequestKey(key);
    try {
      await api.createExternalRequest({
        title: result.title,
        provider_name: result.provider_name,
        provider_url: result.provider_url,
        program_description: result.description || result.summary || "",
        justification,
        cost_amount: result.price_amount || 0,
        cost_currency: result.price_currency || "RUB",
        requested_start_date: dueDate || undefined,
        requested_end_date: dueDate || undefined,
        estimated_duration_hours: result.duration_hours || undefined,
        budget_code: null,
      });
      toast.success("Заявка отправлена. Повторные клики не создадут дубль для этого курса.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось отправить заявку");
    } finally {
      setSendingRequestKey(null);
    }
  }

  async function confirmAssign(result: SmartCourseResult) {
    if (selectedTargetUserIds.length === 0) return toast.error("Выбери хотя бы одного сотрудника или отдел");
    if (!dueDate) return toast.error("Укажи срок прохождения");
    const key = `${result.title}-${result.provider_name}`;
    setAssigningKey(key);
    try {
      if (selectedTargetUserIds.length === 1) {
        const response = await api.assignExternalCourse({
          employee_id: selectedTargetUserIds[0],
          title: result.title,
          provider_name: result.provider_name,
          provider_url: result.provider_url || "https://example.com",
          summary: result.summary || result.why_recommended,
          description: result.description || result.summary || undefined,
          level: result.level || undefined,
          delivery_mode: result.delivery_mode || "online",
          duration_hours: result.duration_hours || undefined,
          due_date: dueDate,
          price_amount: result.price_amount || undefined,
          price_currency: result.price_currency || "RUB",
        });
        toast.success(response.conflict_reason || "Курс назначен сотруднику");
      } else {
        const response = await api.assignExternalCourseBulk({
          user_ids: selectedTargetUserIds,
          title: result.title,
          provider_name: result.provider_name,
          provider_url: result.provider_url || "https://example.com",
          summary: result.summary || result.why_recommended,
          description: result.description || result.summary || undefined,
          level: result.level || undefined,
          delivery_mode: result.delivery_mode || "online",
          duration_hours: result.duration_hours || undefined,
          due_date: dueDate,
          price_amount: result.price_amount || undefined,
          price_currency: result.price_currency || "RUB",
        });
        toast.success(`Назначено: ${response.created}. Напоминаний: ${response.reminders}`);
      }
      setAssignCourse(null);
      setSelectedEmployeeIds([]);
      setSelectedDepartmentIds([]);
      await loadBase();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось назначить курс");
    } finally {
      setAssigningKey(null);
    }
  }

  return (
    <AppShell title="Курсы и внешний поиск" subtitle="Поиск российских курсов, подробное AI-описание и удобное назначение сотрудникам.">
      {loading ? <PageLoader /> : <>
        <section className="card card-pad mb-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">AI-поиск по внешним курсам</h3>
              <p className="mt-1 text-sm text-slate-500">Поиск ориентирован на российские платформы: Яндекс Практикум, Stepik, OTUS, Нетология, Skillbox и похожие.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_220px_220px_auto]">
            <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Например: java, аналитик данных, devops, переговоры" /></div>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <select className="input" value={searchSort} onChange={(e) => setSearchSort(e.target.value)}>
              <option value="ai">Сортировка: рейтинг AI</option>
              <option value="price">Сортировка: цена</option>
              <option value="course_rating">Сортировка: рейтинг курса</option>
              <option value="difficulty">Сортировка: сложность</option>
            </select>
            <button className="btn-primary" onClick={() => runSearch()} disabled={smartLoading}>{smartLoading ? "Ищем..." : "Найти"}</button>
          </div>

          {isEmployee ? <div className="mt-4 rounded-3xl border border-slate-200 p-4">
            <label className="label">Цель прохождения курса</label>
            <textarea className="input min-h-[96px]" value={justification} onChange={(e) => setJustification(e.target.value)} />
          </div> : null}

          <div className="mt-5 space-y-3">
            {sortedResults.map((result) => {
              const actionKey = `${result.title}-${result.provider_name}`;
              return (
                <div key={actionKey} className={`rounded-[28px] border p-5 ${result.is_internal_priority ? "border-brand-200 bg-brand-50/40" : result.is_recommended ? "border-amber-300 bg-amber-50/40" : "border-slate-200"}`}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{result.provider_name}</span>
                        {result.average_rating ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">Рейтинг курса: {result.average_rating.toFixed(1)}</span> : null}
                        {result.ai_rating ? <span className="rounded-full bg-brand-100 px-3 py-1 text-xs text-brand-700">AI: {result.ai_rating.toFixed(1)}</span> : null}
                        {result.difficulty ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{difficultyLabel[result.difficulty] || result.difficulty}</span> : null}
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-900">{result.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{result.summary || result.description || result.why_recommended}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        {result.price_amount !== undefined && result.price_amount !== null ? <span>Цена: {result.price_amount} {result.price_currency || "RUB"}</span> : <span>Цена: не указана</span>}
                        {result.duration_hours ? <span>· {result.duration_hours} ч</span> : null}
                        {result.provider_url ? <span>· есть ссылка на курс</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 xl:w-[320px] xl:justify-end">
                      <button className="btn-secondary" onClick={() => setSelectedCourse(result)}>Подробнее</button>
                      {isHR ? <button className="btn-secondary" onClick={() => favoriteResult(result)}><Star className="mr-2 h-4 w-4" />В рекомендации</button> : null}
                      {isEmployee ? <button className="btn-primary" disabled={sendingRequestKey === actionKey} onClick={() => submitForReview(result)}>{sendingRequestKey === actionKey ? "Отправляем..." : <><Send className="mr-2 h-4 w-4" />Подать заявку</>}</button> : null}
                      {isHR ? <button className="btn-primary" disabled={assigningKey === actionKey} onClick={() => setAssignCourse(result)}><Users className="mr-2 h-4 w-4" />Назначить</button> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card card-pad">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-11" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по внутреннему каталогу компании" /></div>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="all">Все типы</option><option value="internal">Внутренние</option><option value="external">Внешние</option></select>
          </div>

          {filtered.length === 0 ? <EmptyState title="Курсы не найдены" description="Попробуй другой запрос или внешний поиск выше." /> : <div className="mt-6 grid gap-4 xl:grid-cols-2">
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

        {selectedCourse ? (
          <div className="fixed inset-0 z-50 bg-slate-950/35 p-4 backdrop-blur-sm">
            <div className="mx-auto mt-8 max-w-3xl rounded-[32px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">{selectedCourse.provider_name}</div>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedCourse.title}</h3>
                </div>
                <button onClick={() => setSelectedCourse(null)} className="btn-secondary"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Краткое описание</div><div className="mt-2 text-sm text-slate-700">{selectedCourse.description || selectedCourse.summary || "Описание не найдено"}</div></div>
                <div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">AI-отзыв</div><div className="mt-2 text-sm text-slate-700">{selectedCourse.ai_review || selectedCourse.why_recommended}</div></div>
                <div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Цена</div><div className="mt-2 text-lg font-semibold text-slate-900">{selectedCourse.price_amount !== undefined && selectedCourse.price_amount !== null ? `${selectedCourse.price_amount} ${selectedCourse.price_currency || "RUB"}` : "Не указана"}</div></div>
                <div className="rounded-3xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Средний рейтинг</div><div className="mt-2 text-lg font-semibold text-slate-900">{selectedCourse.average_rating ? selectedCourse.average_rating.toFixed(1) : "Нет данных"}</div><div className="mt-1 text-sm text-slate-500">Личный рейтинг AI: {selectedCourse.ai_rating ? selectedCourse.ai_rating.toFixed(1) : "нет"}</div></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">{selectedCourse.tags.map((tag) => <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">{tag}</span>)}</div>
              <div className="mt-6 flex flex-wrap gap-3">
                {selectedCourse.provider_url ? <a href={selectedCourse.provider_url} target="_blank" className="btn-secondary"><ExternalLink className="mr-2 h-4 w-4" />Открыть сайт курса</a> : null}
                {isEmployee ? <button className="btn-primary" onClick={() => submitForReview(selectedCourse)}>Подать заявку</button> : null}
                {isHR ? <button className="btn-primary" onClick={() => { setAssignCourse(selectedCourse); setSelectedCourse(null); }}>Назначить сотрудникам</button> : null}
              </div>
            </div>
          </div>
        ) : null}

        {assignCourse ? (
          <div className="fixed inset-0 z-50 bg-slate-950/35 p-4 backdrop-blur-sm">
            <div className="mx-auto mt-8 max-w-4xl rounded-[32px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">Назначение курса</div>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">{assignCourse.title}</h3>
                </div>
                <button onClick={() => setAssignCourse(null)} className="btn-secondary"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Users className="h-4 w-4" />Выбор сотрудников</div>
                  <div className="max-h-72 space-y-2 overflow-auto">
                    {users.map((employee) => <label key={employee.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${selectedEmployeeIds.includes(employee.id) ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}>
                      <input type="checkbox" checked={selectedEmployeeIds.includes(employee.id)} onChange={() => toggleEmployee(employee.id)} />
                      <span className="text-sm">{employee.last_name} {employee.first_name}<span className="block text-xs text-slate-500">{employee.position_title || "Сотрудник"}</span></span>
                    </label>)}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-700">Или назначить целому отделу</div>
                  <div className="max-h-72 space-y-2 overflow-auto">
                    {departments.map((department) => <label key={department.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${selectedDepartmentIds.includes(department.id) ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}>
                      <input type="checkbox" checked={selectedDepartmentIds.includes(department.id)} onChange={() => toggleDepartment(department.id)} />
                      <span className="text-sm">{department.name}</span>
                    </label>)}
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Будет назначено сотрудникам: <span className="font-semibold text-slate-900">{selectedTargetUserIds.length}</span></div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <input className="input max-w-[220px]" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <button className="btn-primary" disabled={assigningKey === `${assignCourse.title}-${assignCourse.provider_name}`} onClick={() => confirmAssign(assignCourse)}>{assigningKey === `${assignCourse.title}-${assignCourse.provider_name}` ? "Назначаем..." : "Подтвердить назначение"}</button>
              </div>
            </div>
          </div>
        ) : null}
      </>}
    </AppShell>
  );
}
