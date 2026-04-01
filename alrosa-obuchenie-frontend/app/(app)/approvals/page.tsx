"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { useApp } from "@/components/providers/app-provider";
import { api, ApiError } from "@/lib/api";
<<<<<<< HEAD
import type { Course, ExternalRequest } from "@/lib/types";
import { formatDate, requestStatusLabel } from "@/lib/utils";

export default function ApprovalsPage() {
  const { user } = useApp();
  const [externalItems, setExternalItems] = useState<ExternalRequest[]>([]);
  const [managerCourses, setManagerCourses] = useState<Course[]>([]);
=======
import type { ExternalRequest } from "@/lib/types";
import { formatDate, requestStatusLabel } from "@/lib/utils";

export default function ApprovalsPage() {
  const [items, setItems] = useState<ExternalRequest[]>([]);
>>>>>>> d839566c6f869da06a6c368782231753931b1123
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"requests" | "courses">("requests");

  const isHR = user?.role === "hr" || user?.role === "admin";

  async function load() {
    setLoading(true);
    try {
<<<<<<< HEAD
      const [requests, courses] = await Promise.all([
        api.pendingExternalRequests(),
        isHR ? api.listCourses() : Promise.resolve([] as Course[]),
      ]);
      setExternalItems(requests.filter((item) => item.status === "pending_manager_approval" || item.status === "pending_hr_approval"));
      setManagerCourses(courses.filter((course) => course.course_type === "internal" && course.status === "pending_hr_approval"));
=======
      const data = await api.pendingExternalRequests();
      setItems(data.filter((item) => item.status === "pending_manager_approval" || item.status === "pending_hr_approval"));
>>>>>>> d839566c6f869da06a6c368782231753931b1123
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось загрузить согласования";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

<<<<<<< HEAD
  async function actRequest(kind: "approve" | "reject", id: string, status: string) {
=======
  async function act(kind: "approve" | "reject", id: string, status: string) {
>>>>>>> d839566c6f869da06a6c368782231753931b1123
    setBusyId(id + kind);
    try {
      if (status === "pending_manager_approval") {
        if (kind === "approve") await api.managerApprove(id, "Согласовано через frontend");
        else await api.managerReject(id, "Отклонено через frontend");
      } else if (status === "pending_hr_approval") {
        if (kind === "approve") await api.hrApprove(id, "Согласовано через frontend");
        else await api.hrReject(id, "Отклонено через frontend");
      } else {
        toast.error("Заявка уже не ожидает согласования");
        return;
      }
      toast.success(kind === "approve" ? "Заявка согласована" : "Заявка отклонена");
      await load();
    } catch (error) {
<<<<<<< HEAD
      toast.error(error instanceof ApiError ? error.detail : "Не удалось обработать заявку");
    } finally {
      setBusyId(null);
    }
  }

  async function actCourse(kind: "approve" | "reject", id: string) {
    setBusyId(id + kind);
    try {
      if (kind === "approve") await api.approveCourse(id);
      else await api.rejectCourse(id);
      toast.success(kind === "approve" ? "Курс подтверждён и опубликован" : "Курс отклонён");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Не удалось обработать курс");
=======
      const message = error instanceof ApiError ? error.detail : "Не удалось обработать заявку";
      toast.error(message);
>>>>>>> d839566c6f869da06a6c368782231753931b1123
    } finally {
      setBusyId(null);
    }
  }

  return (
<<<<<<< HEAD
    <AppShell title="Согласования" subtitle="Здесь собираются заявки сотрудников и внутренние курсы, которые менеджеры отправили HR на подтверждение.">
      <div className="card card-pad">
        <div className="flex flex-wrap gap-2">
          <button className={tab === "requests" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("requests")}>Заявки сотрудников</button>
          {isHR ? <button className={tab === "courses" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("courses")}>Курсы от менеджеров</button> : null}
        </div>
      </div>

      <div className="mt-6 space-y-4">
=======
    <AppShell title="Согласования" subtitle="HR видит ссылку на курс, автора заявки, даты, стоимость и цель прохождения.">
      <div className="space-y-4">
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card card-pad"><div className="skeleton h-5 w-48" /><div className="mt-3 skeleton h-4 w-full" /></div>
          ))
<<<<<<< HEAD
        ) : tab === "requests" ? (
          externalItems.length === 0 ? (
            <div className="card card-pad text-sm text-slate-500">Нет заявок, ожидающих решения.</div>
          ) : (
            externalItems.map((item) => (
              <div key={item.id} className="card card-pad">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-4xl">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{item.provider_name}</p>
                    <p className="mt-2 text-sm text-slate-600">{requestStatusLabel(item.status)}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Кто хочет пройти</div><div className="mt-1 font-medium text-slate-900">{item.requester_name || "—"}</div><div className="text-slate-500">{item.requester_email || ""}</div></div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Отдел / команда</div><div className="mt-1 font-medium text-slate-900">{item.requester_department_name || "—"}</div><div className="text-slate-500">{item.requester_team_name || "—"}</div></div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Стоимость</div><div className="mt-1 font-medium text-slate-900">{item.cost_amount} {item.cost_currency}</div></div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Даты</div><div className="mt-1 font-medium text-slate-900">{formatDate(item.requested_start_date)} — {formatDate(item.requested_end_date)}</div></div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Длительность</div><div className="mt-1 font-medium text-slate-900">{item.estimated_duration_hours ? `${item.estimated_duration_hours} ч` : "—"}</div></div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Ссылка на курс</div><div className="mt-1 font-medium text-slate-900">{item.provider_url ? <a href={item.provider_url} target="_blank" className="inline-flex items-center gap-1 text-blue-600"><ExternalLink className="h-4 w-4" />Открыть курс</a> : "—"}</div></div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700"><div className="font-semibold text-slate-900">Цель прохождения</div><div className="mt-2 whitespace-pre-wrap">{item.justification}</div></div>
                    {item.program_description ? <div className="mt-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700"><div className="font-semibold text-slate-900">Описание / программа</div><div className="mt-2 whitespace-pre-wrap">{item.program_description}</div></div> : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn-primary" onClick={() => actRequest("approve", item.id, item.status)} disabled={busyId === item.id + "approve"}>{busyId === item.id + "approve" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" />Согласовать</>}</button>
                    <button className="btn-danger" onClick={() => actRequest("reject", item.id, item.status)} disabled={busyId === item.id + "reject"}>{busyId === item.id + "reject" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><X className="mr-2 h-4 w-4" />Отклонить</>}</button>
                  </div>
=======
        ) : items.length === 0 ? (
          <div className="card card-pad text-sm text-slate-500">Нет заявок, ожидающих решения.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card card-pad">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.provider_name}</p>
                  <p className="mt-2 text-sm text-slate-600">{requestStatusLabel(item.status)}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Кто хочет пройти</div>
                      <div className="mt-1 font-medium text-slate-900">{item.requester_name || "—"}</div>
                      <div className="text-slate-500">{item.requester_email || ""}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Отдел / команда</div>
                      <div className="mt-1 font-medium text-slate-900">{item.requester_department_name || "—"}</div>
                      <div className="text-slate-500">{item.requester_team_name || "—"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Стоимость</div>
                      <div className="mt-1 font-medium text-slate-900">{item.cost_amount} {item.cost_currency}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Даты</div>
                      <div className="mt-1 font-medium text-slate-900">{formatDate(item.requested_start_date)} — {formatDate(item.requested_end_date)}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Длительность</div>
                      <div className="mt-1 font-medium text-slate-900">{item.estimated_duration_hours ? `${item.estimated_duration_hours} ч` : "—"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="text-slate-500">Ссылка на курс</div>
                      <div className="mt-1 font-medium text-slate-900">{item.provider_url ? <a href={item.provider_url} target="_blank" className="inline-flex items-center gap-1 text-blue-600"><ExternalLink className="h-4 w-4" />Открыть курс</a> : "—"}</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">Цель прохождения</div>
                    <div className="mt-2 whitespace-pre-wrap">{item.justification}</div>
                  </div>
                  {item.program_description ? <div className="mt-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700"><div className="font-semibold text-slate-900">Описание / программа</div><div className="mt-2 whitespace-pre-wrap">{item.program_description}</div></div> : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary" onClick={() => act("approve", item.id, item.status)} disabled={busyId === item.id + "approve"}>{busyId === item.id + "approve" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" />Согласовать</>}</button>
                  <button className="btn-danger" onClick={() => act("reject", item.id, item.status)} disabled={busyId === item.id + "reject"}>{busyId === item.id + "reject" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><X className="mr-2 h-4 w-4" />Отклонить</>}</button>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
                </div>
              </div>
            ))
          )
        ) : (
          managerCourses.length === 0 ? (
            <div className="card card-pad text-sm text-slate-500">Нет курсов от менеджеров, ожидающих HR.</div>
          ) : (
            managerCourses.map((course) => (
              <div key={course.id} className="card card-pad">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-4xl">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                      <StatusBadge status={course.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{course.summary || course.description || "Менеджер отправил новый внутренний курс на подтверждение."}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Формат</div><div className="mt-1 font-medium text-slate-900">{course.delivery_mode || "online"}</div></div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Длительность</div><div className="mt-1 font-medium text-slate-900">{course.duration_hours ? `${course.duration_hours} ч` : "—"}</div></div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-slate-500">Провайдер</div><div className="mt-1 font-medium text-slate-900">{course.provider_name || "ALROSA LearnFlow"}</div></div>
                    </div>
                    {course.session_days?.length ? <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700"><div className="font-semibold text-slate-900">Дни проведения</div><div className="mt-2 space-y-1">{course.session_days.map((item) => <div key={item}>{item}</div>)}</div></div> : null}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      {typeof course.active_enrollments_count === "number" ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Сейчас проходят: {course.active_enrollments_count}</span> : null}
                      {typeof course.total_enrollments_count === "number" ? <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">Записано: {course.total_enrollments_count}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn-primary" onClick={() => actCourse("approve", course.id)} disabled={busyId === course.id + "approve"}>{busyId === course.id + "approve" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" />Подтвердить</>}</button>
                    <button className="btn-danger" onClick={() => actCourse("reject", course.id)} disabled={busyId === course.id + "reject"}>{busyId === course.id + "reject" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><X className="mr-2 h-4 w-4" />Отклонить</>}</button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </AppShell>
  );
}
