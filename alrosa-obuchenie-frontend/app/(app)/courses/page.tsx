"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookmarkPlus, CheckCircle2, ExternalLink, Globe, Search, Send, Sparkles, Star, UserPlus, WandSparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { StatusBadge } from "@/components/common/status-badge";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api";
import type { Course, Department, Enrollment, SmartCourseResult, User } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const tabs = [
  { key: "recommended", label: "Подобрано для меня" },
  { key: "hr", label: "Рекомендовано HR" },
  { key: "internal", label: "Внутренние курсы" },
  { key: "external", label: "Поиск внешних курсов" },
] as const;

const defaultRequest = {
  title: "",
  provider_name: "",
  provider_url: "",
  program_description: "",
  justification: "",
  cost_amount: "0",
  cost_currency: "RUB",
  requested_start_date: "",
  requested_end_date: "",
  estimated_duration_hours: "",
  budget_code: "",
};

type RequestCandidate = {
  title: string;
  provider_name: string;
  provider_url?: string | null;
  summary?: string | null;
  description?: string | null;
  level?: string | null;
  delivery_mode?: string | null;
  duration_hours?: number | null;
  price_amount?: number | null;
  price_currency?: string | null;
  tags?: string[];
  source_type?: string;
  course_id?: string | null;
};

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

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

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

  const [requestCourse, setRequestCourse] = useState<RequestCandidate | null>(null);
  const [requestForm, setRequestForm] = useState(defaultRequest);
  const [assignCourse, setAssignCourse] = useState<RequestCandidate | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDepartmentFilter, setAssignDepartmentFilter] = useState("all");
  const [assignTeamFilter, setAssignTeamFilter] = useState<string>('');
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

  useEffect(() => {
    void loadBase();
  }, []);

  const enrollmentMap = useMemo(() => new Map(enrollments.map((item) => [item.course_id, item])), [enrollments]);
  const roleText = `${user?.position_title || ""} ${user?.team_name || ""}`.toLowerCase();
  const activeLoad = enrollments.filter((item) => item.status === "in_progress").length;

  const recommended = useMemo(
    () => [...courses].sort((a, b) => scoreCourse(b, roleText, activeLoad) - scoreCourse(a, roleText, activeLoad)),
    [courses, roleText, activeLoad]
  );
  const hrRecommended = useMemo(() => courses.filter((course) => course.is_featured_internal), [courses]);
  const internalCourses = useMemo(() => courses.filter((course) => course.course_type === "internal"), [courses]);

  function buildAiDraft(item: RequestCandidate) {
    const now = new Date();
    const start = addDays(now, 3);
    const duration = item.duration_hours || 24;
    const end = addDays(start, Math.max(14, Math.ceil(duration / 4)));
    const roleHint = [user?.position_title, user?.team_name].filter(Boolean).join(", ");
    return {
      ...defaultRequest,
      title: item.title,
      provider_name: item.provider_name,
      provider_url: item.provider_url || "",
      program_description: item.description || item.summary || "",
      justification: `AI-предзаполнение: курс релевантен для роли ${roleHint || "сотрудника"}, поможет закрыть текущие рабочие задачи и усилить навыки по теме «${item.title}». При необходимости текст можно отредактировать вручную.`,
      cost_amount: item.price_amount ? String(item.price_amount) : "0",
      cost_currency: item.price_currency || "RUB",
      requested_start_date: toInputDate(start),
      requested_end_date: toInputDate(end),
      estimated_duration_hours: item.duration_hours ? String(item.duration_hours) : "",
      budget_code: user?.department_id ? `LND-${String(user.department_id).slice(0, 4).toUpperCase()}` : "LND-GENERAL",
    };
  }

  function normalizeCourse(course: Course): RequestCandidate {
    return {
      title: course.title,
      provider_name: course.provider_name || "ALROSA LearnFlow",
      provider_url: course.provider_url,
      summary: course.summary,
      description: course.description,
      level: course.level,
      delivery_mode: course.delivery_mode,
      duration_hours: course.duration_hours,
      price_amount: undefined,
      price_currency: "RUB",
      tags: course.skill_tags ? course.skill_tags.split(",").map((item) => item.trim()).filter(Boolean) : [],
      source_type: course.course_type,
      course_id: course.id,
    };
  }

  function openRequestModal(item: RequestCandidate) {
    setRequestCourse(item);
    setRequestForm(buildAiDraft(item));
  }

  function openAssignModal(item: RequestCandidate) {
    setAssignCourse(item);
    setSelectedEmployeeIds([]);
    setSelectedDepartmentIds([]);
    setAssignSearch("");
    setAssignDepartmentFilter("all");
    setAssignTeamFilter("all");
    setDueDate("");
  }

  async function runExternalSearch() {
    if (searchQuery.trim().length < 2) return;
    setSmartLoading(true);
    try {
      const payload = await api.externalSearchCourses(searchQuery);
      setResults(payload.results.filter((item) => item.source_type !== "internal"));
      setTab("external");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось выполнить поиск");
    } finally {
      setSmartLoading(false);
    }
  }

  async function startInternalCourse(course: Course) {
    setBusyKey(`enroll-${course.id}`);
    try {
      await api.enroll(course.id);
      toast.success("Курс добавлен в ваше обучение");
      await loadBase();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось начать обучение");
    } finally {
      setBusyKey(null);
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

  async function publishRecommended(item: RequestCandidate) {
    setBusyKey(`favorite-${item.title}`);
    try {
      await api.favoriteExternalCourse({
        title: item.title,
        provider_name: item.provider_name,
        provider_url: item.provider_url || "",
        summary: item.summary,
        description: item.description,
        level: item.level,
        delivery_mode: item.delivery_mode,
        duration_hours: item.duration_hours,
        price_amount: item.price_amount,
        price_currency: item.price_currency,
        skill_tags: item.tags?.join(", ") || null,
      });
      toast.success("Курс добавлен в список рекомендаций HR");
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
      toast.error("Выберите хотя бы одного сотрудника или подразделение");
      return;
    }
    if (!dueDate) {
      toast.error("Укажите дедлайн");
      return;
    }
    setBusyKey(`assign-${assignCourse.title}`);
    try {
      await api.assignExternalCourseBulk({
        user_ids: Array.from(expandedIds),
        title: assignCourse.title,
        provider_name: assignCourse.provider_name,
        provider_url: assignCourse.provider_url || "",
        summary: assignCourse.summary,
        description: assignCourse.description,
        level: assignCourse.level,
        delivery_mode: assignCourse.delivery_mode,
        duration_hours: assignCourse.duration_hours,
        due_date: dueDate,
        price_amount: assignCourse.price_amount,
        price_currency: assignCourse.price_currency || "RUB",
      });
      toast.success("Внешний курс назначен сотрудникам");
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

  const candidateEmployees = useMemo(() => {
    const base = users.filter((candidate) => candidate.role === "employee");
    if (user && !base.find((candidate) => candidate.id === user.id)) return [user, ...base];
    return base;
  }, [users, user]);

  const teamOptions = useMemo(
    () => Array.from(new Set(candidateEmployees.map((item) => item.team_name).filter(Boolean)))
      .map(String), [candidateEmployees]
  );

  const filteredEmployees = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    return candidateEmployees.filter((candidate) => {
      const hay = `${candidate.first_name} ${candidate.last_name} ${candidate.email} ${candidate.team_name || ""} ${candidate.position_title || ""}`.toLowerCase();
      const depMatch = assignDepartmentFilter === "all" || candidate.department_id === assignDepartmentFilter;
      const teamMatch = assignTeamFilter === "all" || (candidate.team_name || "") === assignTeamFilter;
      const searchMatch = !q || hay.includes(q);
      return depMatch && teamMatch && searchMatch;
    });
  }, [candidateEmployees, assignSearch, assignDepartmentFilter, assignTeamFilter]);


  function CourseCard({ course, mode = "catalog" }: { course: Course; mode?: string }) {
    const enrollment = enrollmentMap.get(course.id);
    const isCompleted = enrollment?.status === "completed";
    const isStarted = !!enrollment && enrollment.status !== "completed";
    const isExternal = course.course_type === "external";

    return (
      <article className="rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${isExternal ? "text-emerald-700" : "text-brand-700"}`}>
              {isExternal ? "Внешний курс" : "Внутренний курс"}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{course.title}</h3>
          </div>
          <StatusBadge status={enrollment?.status || course.status} />
        </div>

        <p className="mt-3 text-sm text-slate-500">{course.summary || course.description || "Корпоративный курс в каталоге обучения."}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {course.provider_name ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.provider_name}</span> : null}
          {course.duration_hours ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.duration_hours} ч</span> : null}
          {course.level ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.level}</span> : null}
          {typeof course.active_enrollments_count === "number" ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Сейчас проходят: {course.active_enrollments_count}</span> : null}
          {typeof course.total_enrollments_count === "number" ? <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">Записано: {course.total_enrollments_count}</span> : null}
          {mode === "recommended" ? <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">Подобрано по роли и загрузке</span> : null}
        </div>

        {enrollment ? (
          <div className={`mt-4 rounded-[20px] p-4 text-sm ${isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {isCompleted ? "Этот курс уже завершён и остаётся доступным для просмотра." : `Курс уже находится в обучении. Прогресс: ${enrollment.progress_percent}%`}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          {isCompleted ? (
            <Link href={`/my-learning/${course.id}`} className="btn-secondary"><CheckCircle2 className="h-4 w-4" />Уже пройден</Link>
          ) : isStarted ? (
            <Link href={`/my-learning/${course.id}`} className="btn-primary"><ArrowRight className="h-4 w-4" />Продолжить</Link>
          ) : isExternal ? (
            isEmployee ? (
              <button className="btn-primary" onClick={() => openRequestModal(normalizeCourse(course))}>
                <WandSparkles className="h-4 w-4" />Начать обучение
              </button>
            ) : isHR ? (
              <button className="btn-primary" onClick={() => openAssignModal(normalizeCourse(course))}>
                <UserPlus className="h-4 w-4" />Назначить
              </button>
            ) : (
              <Link href={`/courses/${course.id}`} className="btn-primary">Открыть</Link>
            )
          ) : (
            <button className="btn-primary" onClick={() => startInternalCourse(course)} disabled={busyKey === `enroll-${course.id}`}>
              <Sparkles className="h-4 w-4" />Начать обучение
            </button>
          )}

          <Link href={`/courses/${course.id}`} className="btn-secondary">Подробнее</Link>
          {course.provider_url ? <a href={course.provider_url} target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink className="h-4 w-4" />Источник</a> : null}
        </div>
      </article>
    );
  }

  function ExternalCard({ item }: { item: SmartCourseResult }) {
    const existingEnrollment = item.course_id ? enrollmentMap.get(item.course_id) : undefined;
    const normalized = { ...item, source_type: item.source_type, course_id: item.course_id };
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

        {existingEnrollment ? (
          <div className={`mt-4 rounded-[20px] p-4 text-sm ${existingEnrollment.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {existingEnrollment.status === "completed" ? "Этот курс уже завершён пользователем." : `Курс уже в обучении. Прогресс: ${existingEnrollment.progress_percent}%`}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          {item.provider_url ? <a href={item.provider_url} target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink className="h-4 w-4" />Открыть источник</a> : null}
          {isEmployee && !existingEnrollment ? <button className="btn-primary" onClick={() => openRequestModal(normalized)}><WandSparkles className="h-4 w-4" />Начать обучение</button> : null}
          {isHR ? <button className="btn-success" onClick={() => publishRecommended(normalized)} disabled={busyKey === `favorite-${item.title}`}><BookmarkPlus className="h-4 w-4" />В рекомендации HR</button> : null}
          {isHR ? <button className="btn-primary" onClick={() => openAssignModal(normalized)}><UserPlus className="h-4 w-4" />Назначить</button> : null}
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
            <p className="mt-2 text-sm text-slate-500">В каталоге видно, курс уже проходит пользователь или уже завершил его. Для внешних программ доступно AI-предзаполнение заявки с возможностью ручной правки.</p>
          </div>
          <div className="flex w-full gap-3 xl:max-w-[520px]">
            <input className="input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Например: React, Java, DevOps, аналитика" />
            <button className="btn-primary shrink-0" onClick={runExternalSearch} disabled={smartLoading}>
              {smartLoading ? "Поиск..." : <><Search className="h-4 w-4" />Поиск</>}
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item.key} className={tab === item.key ? "btn-primary" : "btn-secondary"} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
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
              {recommended.length === 0 ? <EmptyState title="Нет доступных рекомендаций" description="Подходящие курсы появятся здесь автоматически." /> : null}
            </div>
          ) : null}

          {tab === "hr" ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {hrRecommended.map((course) => <CourseCard key={course.id} course={course} />)}
              {hrRecommended.length === 0 ? <EmptyState title="HR-подборка пока пуста" description="HR сможет публиковать сюда лучшие внешние и внутренние программы." /> : null}
            </div>
          ) : null}

          {tab === "internal" ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {internalCourses.map((course) => <CourseCard key={course.id} course={course} />)}
              {internalCourses.length === 0 ? <EmptyState title="Внутренние курсы пока не опубликованы" description="После публикации программы появятся здесь." /> : null}
            </div>
          ) : null}

          {tab === "external" ? (
            <div className="space-y-5">
              <div className="card card-pad">
                <div className="flex items-center gap-2 text-slate-900"><Globe className="h-5 w-5 text-brand-700" /><h3 className="text-lg font-bold">Внешние курсы по запросу</h3></div>
                <p className="mt-2 text-sm text-slate-500">Найденные варианты можно отправить на одобрение с AI-предзаполнением или назначить сотрудникам через HR.</p>
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
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"><WandSparkles className="h-3.5 w-3.5" />AI-предзаполнение заявки</div>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">{requestCourse.title}</h3>
                <p className="mt-2 text-sm text-slate-500">Черновик уже заполнен автоматически. Можно скорректировать любой параметр перед отправкой.</p>
              </div>
              <button className="btn-secondary" onClick={() => setRequestCourse(null)}><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 rounded-[24px] bg-brand-50 p-4 text-sm text-brand-700">
              AI предложил даты, длительность, бюджетный код и обоснование на основе роли пользователя и описания курса.
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
                <p className="mt-2 text-sm text-slate-500">Можно назначить курс сотрудникам или подразделению, а также опубликовать его в HR-рекомендациях.</p>
              </div>
              <button className="btn-secondary" onClick={() => setAssignCourse(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-success" onClick={() => publishRecommended(assignCourse)}><Star className="h-4 w-4" />Добавить в HR-рекомендации</button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="label">Кому назначить персонально</label>
                <div className="rounded-[20px] border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <input className="input md:col-span-2" value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} placeholder="Поиск по имени, email, должности, команде" />
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                      <select className="input" value={assignDepartmentFilter} onChange={(e) => setAssignDepartmentFilter(e.target.value)}>
                        <option value="all">Все отделы</option>
                        {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                      </select>
                      <select className="input" value={assignTeamFilter || ''} onChange={(e) => setAssignTeamFilter(e.target.value)}>
                        <option value="all">Все команды</option>
                        {teamOptions.filter(Boolean).map((team) => <option key={team} value={team}>{team}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <div>Найдено: <span className="font-semibold text-slate-900">{filteredEmployees.length}</span> · Выбрано: <span className="font-semibold text-slate-900">{selectedEmployeeIds.length}</span></div>
                    <button className="btn-secondary" type="button" onClick={() => setSelectedEmployeeIds((state) => Array.from(new Set([...state, ...filteredEmployees.map((candidate) => candidate.id)])))}>Выбрать найденных</button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {filteredEmployees.map((candidate) => (
                      <label key={candidate.id} className={`flex cursor-pointer items-start gap-3 rounded-[20px] border p-4 text-sm ${selectedEmployeeIds.includes(candidate.id) ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white"}`}>
                        <input type="checkbox" className="mt-1" checked={selectedEmployeeIds.includes(candidate.id)} onChange={() => setSelectedEmployeeIds((state) => state.includes(candidate.id) ? state.filter((id) => id !== candidate.id) : [...state, candidate.id])} />
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900">{candidate.first_name} {candidate.last_name} {candidate.id === user?.id ? "(я)" : ""}</span>
                          <span className="mt-1 block text-slate-500">{candidate.email}</span>
                          <span className="mt-1 block text-slate-500">{candidate.position_title || "Сотрудник"} · {candidate.team_name || "Без команды"}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {filteredEmployees.length === 0 ? <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">По фильтрам никто не найден.</div> : null}
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
