"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
<<<<<<< HEAD
import { ArrowRight, BookmarkPlus, CheckCircle2, ExternalLink, Globe, Search, Send, Sparkles, Star, UserPlus, WandSparkles, X } from "lucide-react";
=======
import { BookmarkPlus, ExternalLink, Globe, Search, Send, Sparkles, Star, UserPlus, X } from "lucide-react";
>>>>>>> d839566c6f869da06a6c368782231753931b1123
import { useSearchParams } from "next/navigation";
=======
import { ExternalLink, Search, Sparkles, Star, Send, Users, X } from "lucide-react";
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { StatusBadge } from "@/components/common/status-badge";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api";
<<<<<<< HEAD
import type { Course, Department, Enrollment, SmartCourseResult, User } from "@/lib/types";
<<<<<<< HEAD
import { formatDate } from "@/lib/utils";
=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123

const tabs = [
  { key: "recommended", label: "Подобрано для меня" },
  { key: "hr", label: "Рекомендовано HR" },
  { key: "internal", label: "Внутренние курсы" },
  { key: "external", label: "Поиск внешних курсов" },
] as const;

<<<<<<< HEAD
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

=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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

<<<<<<< HEAD
function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
=======
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
>>>>>>> d839566c6f869da06a6c368782231753931b1123
=======
import type { Course, Department, SmartCourseResult, User } from "@/lib/types";

const difficultyLabel: Record<string, string> = {
  easy: "Легкий",
  medium: "Средний",
  hard: "Сложный",
};
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const { user } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
<<<<<<< HEAD
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>(searchParams.get("tab") || "recommended");
  const [searchQuery, setSearchQuery] = useState("react frontend");
  const [smartLoading, setSmartLoading] = useState(false);
  const [results, setResults] = useState<SmartCourseResult[]>([]);
<<<<<<< HEAD

  const [requestCourse, setRequestCourse] = useState<RequestCandidate | null>(null);
  const [requestForm, setRequestForm] = useState(defaultRequest);
  const [assignCourse, setAssignCourse] = useState<RequestCandidate | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDepartmentFilter, setAssignDepartmentFilter] = useState("all");
  const [assignTeamFilter, setAssignTeamFilter] = useState<string>('');
=======
  const [requestCourse, setRequestCourse] = useState<SmartCourseResult | null>(null);
  const [requestForm, setRequestForm] = useState(defaultRequest);
  const [assignCourse, setAssignCourse] = useState<SmartCourseResult | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
>>>>>>> d839566c6f869da06a6c368782231753931b1123
  const [dueDate, setDueDate] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

=======
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
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
  const isHR = user?.role === "hr" || user?.role === "admin";
  const isEmployee = user?.role === "employee";

  async function loadBase() {
    setLoading(true);
    try {
<<<<<<< HEAD
      const [courseData, enrollmentData, userData, departmentData] = await Promise.all([
        api.listCourses(),
        api.myEnrollments(),
=======
      const [courseData, userData, departmentData] = await Promise.all([
        api.listCourses(),
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
        isHR ? api.listUsers() : Promise.resolve([] as User[]),
        isHR ? api.listDepartments() : Promise.resolve([] as Department[]),
      ]);
      setCourses(courseData);
<<<<<<< HEAD
      setEnrollments(enrollmentData);
      setUsers(userData);
=======
      setUsers(userData.filter((item) => item.role === "employee"));
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
      setDepartments(departmentData);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить каталог");
    } finally {
      setLoading(false);
    }
  }

<<<<<<< HEAD
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

=======
  useEffect(() => { void loadBase(); }, []);

  const enrolledIds = new Set(enrollments.map((item) => item.course_id));
  const roleText = `${user?.position_title || ""} ${user?.team_name || ""}`.toLowerCase();
  const activeLoad = enrollments.filter((item) => item.status === "in_progress").length;

  const recommended = useMemo(() => courses.filter((course) => !enrolledIds.has(course.id)).sort((a, b) => scoreCourse(b, roleText, activeLoad) - scoreCourse(a, roleText, activeLoad)), [courses, roleText, activeLoad]);
  const hrRecommended = useMemo(() => courses.filter((course) => course.is_featured_internal), [courses]);
  const internalCourses = useMemo(() => courses.filter((course) => course.course_type === "internal"), [courses]);

>>>>>>> d839566c6f869da06a6c368782231753931b1123
  async function runExternalSearch() {
    if (searchQuery.trim().length < 2) return;
    setSmartLoading(true);
    try {
      const payload = await api.externalSearchCourses(searchQuery);
<<<<<<< HEAD
      setResults(payload.results.filter((item) => item.source_type !== "internal"));
=======
      setResults(payload.results);
>>>>>>> d839566c6f869da06a6c368782231753931b1123
      setTab("external");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось выполнить поиск");
    } finally {
      setSmartLoading(false);
    }
  }

<<<<<<< HEAD
<<<<<<< HEAD
  async function startInternalCourse(course: Course) {
    setBusyKey(`enroll-${course.id}`);
    try {
      await api.enroll(course.id);
      toast.success("Курс добавлен в ваше обучение");
=======
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
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
      await loadBase();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось начать обучение");
    } finally {
      setBusyKey(null);
    }
  }

<<<<<<< HEAD
=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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
=======
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
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
    }
  }

<<<<<<< HEAD
  async function publishRecommended(item: RequestCandidate) {
=======
  async function publishRecommended(item: SmartCourseResult) {
>>>>>>> d839566c6f869da06a6c368782231753931b1123
    setBusyKey(`favorite-${item.title}`);
    try {
      await api.favoriteExternalCourse({
        title: item.title,
        provider_name: item.provider_name,
<<<<<<< HEAD
        provider_url: item.provider_url || "",
=======
        provider_url: item.provider_url,
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        summary: item.summary,
        description: item.description,
        level: item.level,
        delivery_mode: item.delivery_mode,
        duration_hours: item.duration_hours,
        price_amount: item.price_amount,
        price_currency: item.price_currency,
        skill_tags: item.tags?.join(", ") || null,
      });
<<<<<<< HEAD
      toast.success("Курс добавлен в список рекомендаций HR");
=======
      toast.success("Курс добавлен в общий список рекомендованных");
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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
<<<<<<< HEAD
      toast.error("Выберите хотя бы одного сотрудника или подразделение");
      return;
    }
    if (!dueDate) {
      toast.error("Укажите дедлайн");
=======
      toast.error("Выбери хотя бы одного сотрудника или подразделение");
      return;
    }
    if (!dueDate) {
      toast.error("Укажи дедлайн");
>>>>>>> d839566c6f869da06a6c368782231753931b1123
      return;
    }
    setBusyKey(`assign-${assignCourse.title}`);
    try {
      await api.assignExternalCourseBulk({
        user_ids: Array.from(expandedIds),
        title: assignCourse.title,
        provider_name: assignCourse.provider_name,
<<<<<<< HEAD
        provider_url: assignCourse.provider_url || "",
=======
        provider_url: assignCourse.provider_url,
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        summary: assignCourse.summary,
        description: assignCourse.description,
        level: assignCourse.level,
        delivery_mode: assignCourse.delivery_mode,
        duration_hours: assignCourse.duration_hours,
        due_date: dueDate,
        price_amount: assignCourse.price_amount,
        price_currency: assignCourse.price_currency || "RUB",
      });
<<<<<<< HEAD
      toast.success("Внешний курс назначен сотрудникам");
=======
      toast.success("Внешний курс назначен и добавлен в обучение");
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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

<<<<<<< HEAD
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

=======
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
>>>>>>> d839566c6f869da06a6c368782231753931b1123
    return (
      <article className="rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
<<<<<<< HEAD
            <div className={`text-xs font-semibold uppercase tracking-wide ${isExternal ? "text-emerald-700" : "text-brand-700"}`}>
              {isExternal ? "Внешний курс" : "Внутренний курс"}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{course.title}</h3>
          </div>
          <StatusBadge status={enrollment?.status || course.status} />
        </div>

        <p className="mt-3 text-sm text-slate-500">{course.summary || course.description || "Корпоративный курс в каталоге обучения."}</p>

=======
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.course_type === "internal" ? "Внутренний курс" : "Внешний / рекомендованный"}</div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{course.title}</h3>
          </div>
          <StatusBadge status={course.status} />
        </div>
        <p className="mt-3 text-sm text-slate-500">{course.summary || course.description || "Корпоративный курс в каталоге обучения."}</p>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {course.provider_name ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.provider_name}</span> : null}
          {course.duration_hours ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.duration_hours} ч</span> : null}
          {course.level ? <span className="rounded-full bg-slate-100 px-3 py-1">{course.level}</span> : null}
<<<<<<< HEAD
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
=======
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-slate-500">{mode === "recommended" ? "Подобрано по роли и загрузке" : "Доступно в каталоге"}</span>
          <Link href={`/courses/${course.id}`} className="btn-primary">Открыть</Link>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        </div>
      </article>
    );
  }

  function ExternalCard({ item }: { item: SmartCourseResult }) {
<<<<<<< HEAD
    const existingEnrollment = item.course_id ? enrollmentMap.get(item.course_id) : undefined;
    const normalized = { ...item, source_type: item.source_type, course_id: item.course_id };
=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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
<<<<<<< HEAD

=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        <p className="mt-3 text-sm text-slate-500">{item.ai_review || item.summary || item.description || "Внешний курс найден по запросу."}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {item.tags?.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1">{tag}</span>)}
          {item.duration_hours ? <span className="rounded-full bg-slate-100 px-3 py-1">{item.duration_hours} ч</span> : null}
          {item.price_amount !== null && item.price_amount !== undefined ? <span className="rounded-full bg-slate-100 px-3 py-1">{item.price_amount} {item.price_currency || "RUB"}</span> : null}
        </div>
<<<<<<< HEAD

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
=======
        <div className="mt-5 flex flex-wrap gap-3">
          {item.provider_url ? <a href={item.provider_url} target="_blank" className="btn-secondary"><ExternalLink className="h-4 w-4" />Открыть источник</a> : null}
          {isEmployee ? <button className="btn-primary" onClick={() => openRequestModal(item)}><Send className="h-4 w-4" />Запросить одобрение</button> : null}
          {isHR ? <button className="btn-success" onClick={() => publishRecommended(item)} disabled={busyKey === `favorite-${item.title}`}><BookmarkPlus className="h-4 w-4" />В общий доступ</button> : null}
          {isHR ? <button className="btn-primary" onClick={() => setAssignCourse(item)}><UserPlus className="h-4 w-4" />Назначить</button> : null}
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        </div>
      </article>
    );
  }

  return (
<<<<<<< HEAD
    <AppShell title="Каталог обучения">
      <div className="card card-pad">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-slate-900">Найди нужный формат обучения</h2>
<<<<<<< HEAD
            <p className="mt-2 text-sm text-slate-500">В каталоге видно, курс уже проходит пользователь или уже завершил его. Для внешних программ доступно AI-предзаполнение заявки с возможностью ручной правки.</p>
          </div>
          <div className="flex w-full gap-3 xl:max-w-[520px]">
            <input className="input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Например: React, Java, DevOps, аналитика" />
            <button className="btn-primary shrink-0" onClick={runExternalSearch} disabled={smartLoading}>
              {smartLoading ? "Поиск..." : <><Search className="h-4 w-4" />Поиск</>}
            </button>
=======
            <p className="mt-2 text-sm text-slate-500">Внешний поиск вынесен отдельно. Внутренние курсы, рекомендованные HR и твои курсы не смешиваются между собой.</p>
          </div>
          <div className="flex w-full gap-3 xl:max-w-[520px]">
            <input className="input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Например: React, Java, DevOps, аналитика" />
            <button className="btn-primary shrink-0" onClick={runExternalSearch} disabled={smartLoading}>{smartLoading ? "Поиск..." : <><Search className="h-4 w-4" />Поиск</>}</button>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
<<<<<<< HEAD
            <button key={item.key} className={tab === item.key ? "btn-primary" : "btn-secondary"} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
=======
            <button key={item.key} className={tab === item.key ? "btn-primary" : "btn-secondary"} onClick={() => setTab(item.key)}>{item.label}</button>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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
<<<<<<< HEAD
              {recommended.length === 0 ? <EmptyState title="Нет доступных рекомендаций" description="Подходящие курсы появятся здесь автоматически." /> : null}
=======
              {recommended.length === 0 ? <EmptyState title="Нет доступных рекомендаций" description="Все подходящие курсы уже назначены или пройдены." /> : null}
>>>>>>> d839566c6f869da06a6c368782231753931b1123
            </div>
          ) : null}

          {tab === "hr" ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {hrRecommended.map((course) => <CourseCard key={course.id} course={course} />)}
<<<<<<< HEAD
              {hrRecommended.length === 0 ? <EmptyState title="HR-подборка пока пуста" description="HR сможет публиковать сюда лучшие внешние и внутренние программы." /> : null}
=======
              {hrRecommended.length === 0 ? <EmptyState title="HR-подборка пока пуста" description="HR может добавлять внешние курсы в общий список рекомендаций прямо из внешнего поиска." /> : null}
>>>>>>> d839566c6f869da06a6c368782231753931b1123
            </div>
          ) : null}

          {tab === "internal" ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {internalCourses.map((course) => <CourseCard key={course.id} course={course} />)}
<<<<<<< HEAD
              {internalCourses.length === 0 ? <EmptyState title="Внутренние курсы пока не опубликованы" description="После публикации программы появятся здесь." /> : null}
=======
              {internalCourses.length === 0 ? <EmptyState title="Внутренние курсы пока не опубликованы" description="После публикации они появятся здесь отдельным блоком." /> : null}
>>>>>>> d839566c6f869da06a6c368782231753931b1123
            </div>
          ) : null}

          {tab === "external" ? (
            <div className="space-y-5">
              <div className="card card-pad">
                <div className="flex items-center gap-2 text-slate-900"><Globe className="h-5 w-5 text-brand-700" /><h3 className="text-lg font-bold">Внешние курсы по запросу</h3></div>
<<<<<<< HEAD
                <p className="mt-2 text-sm text-slate-500">Найденные варианты можно отправить на одобрение с AI-предзаполнением или назначить сотрудникам через HR.</p>
=======
                <p className="mt-2 text-sm text-slate-500">Здесь только внешние курсы. Внутренний каталог и уже рекомендованные курсы сюда не подмешиваются.</p>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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
<<<<<<< HEAD
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"><WandSparkles className="h-3.5 w-3.5" />AI-предзаполнение заявки</div>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">{requestCourse.title}</h3>
                <p className="mt-2 text-sm text-slate-500">Черновик уже заполнен автоматически. Можно скорректировать любой параметр перед отправкой.</p>
              </div>
              <button className="btn-secondary" onClick={() => setRequestCourse(null)}><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 rounded-[24px] bg-brand-50 p-4 text-sm text-brand-700">
              AI предложил даты, длительность, бюджетный код и обоснование на основе роли пользователя и описания курса.
            </div>

=======
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Заявка на внешний курс</div>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{requestCourse.title}</h3>
                <p className="mt-2 text-sm text-slate-500">Сотрудник отправляет ссылку и обоснование, зачем этот курс нужен для работы.</p>
              </div>
              <button className="btn-secondary" onClick={() => setRequestCourse(null)}><X className="h-4 w-4" /></button>
            </div>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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
<<<<<<< HEAD

=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
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
<<<<<<< HEAD
                <p className="mt-2 text-sm text-slate-500">Можно назначить курс сотрудникам или подразделению, а также опубликовать его в HR-рекомендациях.</p>
=======
                <p className="mt-2 text-sm text-slate-500">Можно назначить курс конкретным сотрудникам, подразделению или себе, а также предварительно выложить его в общий список рекомендаций.</p>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
              </div>
              <button className="btn-secondary" onClick={() => setAssignCourse(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
<<<<<<< HEAD
              <button className="btn-success" onClick={() => publishRecommended(assignCourse)}><Star className="h-4 w-4" />Добавить в HR-рекомендации</button>
=======
              <button className="btn-success" onClick={() => publishRecommended(assignCourse)}><Star className="h-4 w-4" />Выложить как рекомендованный</button>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="label">Кому назначить персонально</label>
<<<<<<< HEAD
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
=======
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
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
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
=======
                <div className="grid gap-2 rounded-[20px] border border-slate-200 p-4">
                  {candidateEmployees.map((candidate) => (
                    <label key={candidate.id} className="flex items-center gap-3 text-sm text-slate-700">
                      <input type="checkbox" checked={selectedEmployeeIds.includes(candidate.id)} onChange={() => setSelectedEmployeeIds((state) => state.includes(candidate.id) ? state.filter((id) => id !== candidate.id) : [...state, candidate.id])} />
                      <span>{candidate.first_name} {candidate.last_name} {candidate.id === user?.id ? "(я)" : ""}</span>
                    </label>
                  ))}
>>>>>>> d839566c6f869da06a6c368782231753931b1123
                </div>
<<<<<<< HEAD
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
=======
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
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
                </div>
              </div>
<<<<<<< HEAD
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button className="btn-secondary" onClick={() => setAssignCourse(null)}>Отмена</button>
              <button className="btn-primary" onClick={assignSelected} disabled={busyKey === `assign-${assignCourse.title}`}><UserPlus className="h-4 w-4" />Назначить курс</button>
            </div>
          </div>
        </div>
      ) : null}
=======
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
>>>>>>> 8d25defbe30f6077bce6537b18d14c5008e686a2
    </AppShell>
  );
}
