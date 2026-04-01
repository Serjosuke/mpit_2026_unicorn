"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookmarkPlus, ExternalLink, Globe, Search, Send, Sparkles, Star, UserPlus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { StatusBadge } from "@/components/common/status-badge";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api";
import type { Course, Department, Enrollment, SmartCourseResult, User } from "@/lib/types";

const tabs = [
  { key: "recommended", label: "Подобрано для меня" },
  { key: "hr", label: "Рекомендовано HR" },
  { key: "internal", label: "Внутренние курсы" },
  { key: "external", label: "Поиск внешних курсов" },
] as const;

function scoreCourse(course: Course, roleText: string, load: number) {
  const text = `${course.title} ${course.summary || ""} ${course.description || ""} ${course.skill_tags || ""}`.toLowerCase();
  let score = 0;
  if (course.is_featured_internal) score += 20;
  if (course.course_type === "internal") score += 16;
  if (roleText.includes("frontend") || roleText.includes("react")) {
    if (text.includes("frontend") || text.includes("react") || text.includes("коммуникац")) score += 18;
  }
  if (roleText.includes("backend") || roleText.includes("java")) {
    if (text.includes("backend") || text.includes("java") || text.includes("spring")) score += 18;
  }
  if (roleText.includes("manager") || roleText.includes("руковод")) {
    if (text.includes("управ") || text.includes("коммуникац") || text.includes("product")) score += 16;
  }
  if (load >= 3 && (course.duration_hours || 0) > 20) score -= 10;
  if (load >= 3 && (course.duration_hours || 0) <= 12) score += 8;
  return score + Math.max(0, 10 - (course.source_priority || 10));
}

const defaultRequest = {
  title: "",
  provider_name: "",
  provider_url: "",
  program_description: "",
  justification: "Этот курс поможет мне решать рабочие задачи и развиваться по текущей роли.",
  cost_amount: "0",
  cost_currency: "RUB",
  requested_start_date: "",
  requested_end_date: "",
  estimated_duration_hours: "",
  budget_code: "",
};

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const { user } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>(searchParams.get("tab") || "recommended");
  const [searchQuery, setSearchQuery] = useState("react frontend");
  const [smartLoading, setSmartLoading] = useState(false);
  const [results, setResults] = useState<SmartCourseResult[]>([]);
  const [requestCourse, setRequestCourse] = useState<SmartCourseResult | null>(null);
  const [requestForm, setRequestForm] = useState(defaultRequest);
  const [assignCourse, setAssignCourse] = useState<SmartCourseResult | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const isHR = user?.role === "hr" || user?.role === "admin";
  const isEmployee = user?.role === "employee";

  async function loadBase() {
    setLoading(true);
    try {
      const [courseData, enrollmentData, userData, departmentData] = await Promise.all([
        api.listCourses(),
        api.myEnrollments(),
        isHR ? api.listUsers() : Promise.resolve([] as User[]),
        isHR ? api.listDepartments() : Promise.resolve([] as Department[]),
      ]);
      setCourses(courseData);
      setEnrollments(enrollmentData);
      setUsers(userData);
      setDepartments(departmentData);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить каталог");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadBase(); }, []);

  const enrolledIds = new Set(enrollments.map((item) => item.course_id));
  const roleText = `${user?.position_title || ""} ${user?.team_name || ""}`.toLowerCase();
  const activeLoad = enrollments.filter((item) => item.status === "in_progress").length;

  const recommended = useMemo(() => courses.filter((course) => !enrolledIds.has(course.id)).sort((a, b) => scoreCourse(b, roleText, activeLoad) - scoreCourse(a, roleText, activeLoad)), [courses, roleText, activeLoad]);
  const hrRecommended = useMemo(() => courses.filter((course) => course.is_featured_internal), [courses]);
  const internalCourses = useMemo(() => courses.filter((course) => course.course_type === "internal"), [courses]);

  async function runExternalSearch() {
    if (searchQuery.trim().length < 2) return;
    setSmartLoading(true);
    try {
      const payload = await api.externalSearchCourses(searchQuery);
      setResults(payload.results);
      setTab("external");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось выполнить поиск");
    } finally {
      setSmartLoading(false);
    }
  }

  async function submitExternalRequest() {
    if (!requestCourse) return;
    setBusyKey(`request-${requestCourse.title}`);
    try {
      await api.createExternalRequest({
        ...requestForm,
        cost_amount: Number(requestForm.cost_amount || 0),
        estimated_duration_hours: requestForm.estimated_duration_hours ? Number(requestForm.estimated_duration_hours) : null,
        requested_start_date: requestForm.requested_start_date || null,
        requested_end_date: requestForm.requested_end_date || null,
        budget_code: requestForm.budget_code || null,
      });
      toast.success("Заявка на внешний курс отправлена");
      setRequestCourse(null);
      setRequestForm(defaultRequest);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось отправить заявку");
    } finally {
      setBusyKey(null);
    }
  }

  async function publishRecommended(item: SmartCourseResult) {
    setBusyKey(`favorite-${item.title}`);
    try {
      await api.favoriteExternalCourse({
        title: item.title,
        provider_name: item.provider_name,
        provider_url: item.provider_url,
        summary: item.summary,
        description: item.description,
        level: item.level,
        delivery_mode: item.delivery_mode,
        duration_hours: item.duration_hours,
        price_amount: item.price_amount,
        price_currency: item.price_currency,
        skill_tags: item.tags?.join(", ") || null,
      });
      toast.success("Курс добавлен в общий список рекомендованных");
      await loadBase();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось сохранить рекомендацию");
    } finally {
      setBusyKey(null);
    }
  }

  async function assignSelected() {
    if (!assignCourse) return;
    const pool = users.filter((candidate) => candidate.role === "employee" || candidate.id === user?.id);
    const expandedIds = new Set(selectedEmployeeIds);
    selectedDepartmentIds.forEach((depId) => {
      pool.filter((candidate) => candidate.department_id === depId).forEach((candidate) => expandedIds.add(candidate.id));
    });
    if (expandedIds.size === 0) {
      toast.error("Выбери хотя бы одного сотрудника или подразделение");
      return;
    }
    if (!dueDate) {
      toast.error("Укажи дедлайн");
      return;
    }
    setBusyKey(`assign-${assignCourse.title}`);
    try {
      await api.assignExternalCourseBulk({
        user_ids: Array.from(expandedIds),
        title: assignCourse.title,
        provider_name: assignCourse.provider_name,
        provider_url: assignCourse.provider_url,
        summary: assignCourse.summary,
        description: assignCourse.description,
        level: assignCourse.level,
        delivery_mode: assignCourse.delivery_mode,
        duration_hours: assignCourse.duration_hours,
        due_date: dueDate,
        price_amount: assignCourse.price_amount,
        price_currency: assignCourse.price_currency || "RUB",
      });
      toast.success("Внешний курс назначен и добавлен в обучение");
      setAssignCourse(null);
      setSelectedDepartmentIds([]);
      setSelectedEmployeeIds([]);
      setDueDate("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось назначить курс");
    } finally {
      setBusyKey(null);
    }
  }

  function openRequestModal(item: SmartCourseResult) {
    setRequestCourse(item);
    setRequestForm({
      ...defaultRequest,
      title: item.title,
      provider_name: item.provider_name,
      provider_url: item.provider_url || "",
      program_description: item.description || item.summary || "",
      cost_amount: item.price_amount ? String(item.price_amount) : "0",
      cost_currency: item.price_currency || "RUB",
      estimated_duration_hours: item.duration_hours ? String(item.duration_hours) : "",
    });
  }

  const candidateEmployees = useMemo(() => {
    const base = users.filter((candidate) => candidate.role === "employee");
    if (user && !base.find((candidate) => candidate.id === user.id)) {
      return [user, ...base];
    }
    return base;
  }, [users, user]);

  function CourseCard({ course, mode = "catalog" }: { course: Course; mode?: string }) {
    return (
      <article className="rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.course_type === "internal" ? "Внутренний курс" : "Внешний / рекомендованный"}</div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{course.title}</h3>
          </div>
          <StatusBadge status={course.status} />
        </div>
        <p className="mt-3 text-sm text-slate-500">{course.summary || course.description || "Корпоративный курс в каталоге обучения."}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {course.provider_name ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.provider_name}</span> : null}
          {course.duration_hours ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.duration_hours} ч</span> : null}
          {course.level ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.level}</span> : null}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-slate-500">{mode === "recommended" ? "Подобрано по роли и загрузке" : "Доступно в каталоге"}</span>
          <Link href={`/courses/${course.id}`} className="btn-primary">Открыть</Link>
        </div>
      </article>
    );
  }

  function ExternalCard({ item }: { item: SmartCourseResult }) {
    return (
      <article className="rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"><Sparkles className="h-3.5 w-3.5" />Внешний курс</div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
            <div className="mt-1 text-sm text-slate-500">{item.provider_name}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-900">{item.ai_rating ? `${item.ai_rating}/5` : "—"}</div>
            <div className="text-xs text-slate-500">AI-оценка</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">{item.ai_review || item.summary || item.description || "Внешний курс найден по запросу."}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {item.tags?.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1">{tag}</span>)}
          {item.duration_hours ? <span className="rounded-full bg-slate-100 px-3 py-1">{item.duration_hours} ч</span> : null}
          {item.price_amount !== null && item.price_amount !== undefined ? <span className="rounded-full bg-slate-100 px-3 py-1">{item.price_amount} {item.price_currency || "RUB"}</span> : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {item.provider_url ? <a href={item.provider_url} target="_blank" className="btn-secondary"><ExternalLink className="h-4 w-4" />Открыть источник</a> : null}
          {isEmployee ? <button className="btn-primary" onClick={() => openRequestModal(item)}><Send className="h-4 w-4" />Запросить одобрение</button> : null}
          {isHR ? <button className="btn-success" onClick={() => publishRecommended(item)} disabled={busyKey === `favorite-${item.title}`}><BookmarkPlus className="h-4 w-4" />В общий доступ</button> : null}
          {isHR ? <button className="btn-primary" onClick={() => setAssignCourse(item)}><UserPlus className="h-4 w-4" />Назначить</button> : null}
        </div>
      </article>
    );
  }

  return (
    <AppShell title="Каталог обучения">
      <div className="card card-pad">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-slate-900">Найди нужный формат обучения</h2>
            <p className="mt-2 text-sm text-slate-500">Внешний поиск вынесен отдельно. Внутренние курсы, рекомендованные HR и твои курсы не смешиваются между собой.</p>
          </div>
          <div className="flex w-full gap-3 xl:max-w-[520px]">
            <input className="input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Например: React, Java, DevOps, аналитика" />
            <button className="btn-primary shrink-0" onClick={runExternalSearch} disabled={smartLoading}>{smartLoading ? "Поиск..." : <><Search className="h-4 w-4" />Поиск</>}</button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item.key} className={tab === item.key ? "btn-primary" : "btn-secondary"} onClick={() => setTab(item.key)}>{item.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6"><PageLoader /></div>
      ) : (
        <div className="mt-6">
          {tab === "recommended" ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {recommended.slice(0, 12).map((course) => <CourseCard key={course.id} course={course} mode="recommended" />)}
              {recommended.length === 0 ? <EmptyState title="Нет доступных рекомендаций" description="Все подходящие курсы уже назначены или пройдены." /> : null}
            </div>
          ) : null}

          {tab === "hr" ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {hrRecommended.map((course) => <CourseCard key={course.id} course={course} />)}
              {hrRecommended.length === 0 ? <EmptyState title="HR-подборка пока пуста" description="HR может добавлять внешние курсы в общий список рекомендаций прямо из внешнего поиска." /> : null}
            </div>
          ) : null}

          {tab === "internal" ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {internalCourses.map((course) => <CourseCard key={course.id} course={course} />)}
              {internalCourses.length === 0 ? <EmptyState title="Внутренние курсы пока не опубликованы" description="После публикации они появятся здесь отдельным блоком." /> : null}
            </div>
          ) : null}

          {tab === "external" ? (
            <div className="space-y-5">
              <div className="card card-pad">
                <div className="flex items-center gap-2 text-slate-900"><Globe className="h-5 w-5 text-brand-700" /><h3 className="text-lg font-bold">Внешние курсы по запросу</h3></div>
                <p className="mt-2 text-sm text-slate-500">Здесь только внешние курсы. Внутренний каталог и уже рекомендованные курсы сюда не подмешиваются.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {results.map((item) => <ExternalCard key={`${item.provider_name}-${item.title}`} item={item} />)}
              </div>
              {results.length === 0 ? <EmptyState title="Сначала выполни поиск" description="Например: React, аналитика данных, управление проектами, информационная безопасность." /> : null}
            </div>
          ) : null}
        </div>
      )}

      {requestCourse ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="card max-h-[92vh] w-full max-w-3xl overflow-y-auto card-pad fade-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Заявка на внешний курс</div>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{requestCourse.title}</h3>
                <p className="mt-2 text-sm text-slate-500">Сотрудник отправляет ссылку и обоснование, зачем этот курс нужен для работы.</p>
              </div>
              <button className="btn-secondary" onClick={() => setRequestCourse(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div><label className="label">Название курса</label><input className="input" value={requestForm.title} onChange={(e) => setRequestForm((s) => ({ ...s, title: e.target.value }))} /></div>
              <div><label className="label">Провайдер</label><input className="input" value={requestForm.provider_name} onChange={(e) => setRequestForm((s) => ({ ...s, provider_name: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">Ссылка</label><input className="input" value={requestForm.provider_url} onChange={(e) => setRequestForm((s) => ({ ...s, provider_url: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">Почему этот курс нужен</label><textarea className="input h-28 py-3" value={requestForm.justification} onChange={(e) => setRequestForm((s) => ({ ...s, justification: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">Описание / программа</label><textarea className="input h-28 py-3" value={requestForm.program_description} onChange={(e) => setRequestForm((s) => ({ ...s, program_description: e.target.value }))} /></div>
              <div><label className="label">Стоимость</label><input className="input" type="number" min="0" value={requestForm.cost_amount} onChange={(e) => setRequestForm((s) => ({ ...s, cost_amount: e.target.value }))} /></div>
              <div><label className="label">Валюта</label><input className="input" value={requestForm.cost_currency} onChange={(e) => setRequestForm((s) => ({ ...s, cost_currency: e.target.value }))} /></div>
              <div><label className="label">Дата старта</label><input className="input" type="date" value={requestForm.requested_start_date} onChange={(e) => setRequestForm((s) => ({ ...s, requested_start_date: e.target.value }))} /></div>
              <div><label className="label">Дедлайн / дата окончания</label><input className="input" type="date" value={requestForm.requested_end_date} onChange={(e) => setRequestForm((s) => ({ ...s, requested_end_date: e.target.value }))} /></div>
              <div><label className="label">Часы</label><input className="input" type="number" min="0" value={requestForm.estimated_duration_hours} onChange={(e) => setRequestForm((s) => ({ ...s, estimated_duration_hours: e.target.value }))} /></div>
              <div><label className="label">Код бюджета</label><input className="input" value={requestForm.budget_code} onChange={(e) => setRequestForm((s) => ({ ...s, budget_code: e.target.value }))} /></div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button className="btn-secondary" onClick={() => setRequestCourse(null)}>Отмена</button>
              <button className="btn-primary" onClick={submitExternalRequest} disabled={busyKey === `request-${requestCourse.title}`}><Send className="h-4 w-4" />Отправить на одобрение</button>
            </div>
          </div>
        </div>
      ) : null}

      {assignCourse ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="card max-h-[92vh] w-full max-w-4xl overflow-y-auto card-pad fade-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">HR / L&D действие</div>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{assignCourse.title}</h3>
                <p className="mt-2 text-sm text-slate-500">Можно назначить курс конкретным сотрудникам, подразделению или себе, а также предварительно выложить его в общий список рекомендаций.</p>
              </div>
              <button className="btn-secondary" onClick={() => setAssignCourse(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-success" onClick={() => publishRecommended(assignCourse)}><Star className="h-4 w-4" />Выложить как рекомендованный</button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="label">Кому назначить персонально</label>
                <div className="grid gap-2 rounded-[20px] border border-slate-200 p-4">
                  {candidateEmployees.map((candidate) => (
                    <label key={candidate.id} className="flex items-center gap-3 text-sm text-slate-700">
                      <input type="checkbox" checked={selectedEmployeeIds.includes(candidate.id)} onChange={() => setSelectedEmployeeIds((state) => state.includes(candidate.id) ? state.filter((id) => id !== candidate.id) : [...state, candidate.id])} />
                      <span>{candidate.first_name} {candidate.last_name} {candidate.id === user?.id ? "(я)" : ""}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Или назначить по подразделению</label>
                <div className="grid gap-2 rounded-[20px] border border-slate-200 p-4">
                  {departments.map((department) => (
                    <label key={department.id} className="flex items-center gap-3 text-sm text-slate-700">
                      <input type="checkbox" checked={selectedDepartmentIds.includes(department.id)} onChange={() => setSelectedDepartmentIds((state) => state.includes(department.id) ? state.filter((id) => id !== department.id) : [...state, department.id])} />
                      <span>{department.name}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="label">Дедлайн</label>
                  <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button className="btn-secondary" onClick={() => setAssignCourse(null)}>Отмена</button>
              <button className="btn-primary" onClick={assignSelected} disabled={busyKey === `assign-${assignCourse.title}`}><UserPlus className="h-4 w-4" />Назначить курс</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
