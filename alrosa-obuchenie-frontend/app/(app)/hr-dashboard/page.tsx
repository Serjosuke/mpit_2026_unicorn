"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import { getToken } from "@/lib/storage";
import type { Department, MonitorPayload } from "@/lib/types";

const statusStyles: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700",
  warning: "bg-amber-100 text-amber-700",
  ok: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  not_started: "bg-slate-100 text-slate-600",
};

export default function HRDashboardPage() {
  const [payload, setPayload] = useState<MonitorPayload | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [query, setQuery] = useState("");

  async function load(selectedDepartmentId?: string) {
    try {
      const [monitor, deps] = await Promise.all([api.monitorMetrics(selectedDepartmentId), api.listDepartments()]);
      setPayload(monitor);
      setDepartments(deps);
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось загрузить монитор";
      toast.error(message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const items = payload?.rows ?? [];
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((row) => [row.employee_name, row.department_name, row.team_name, row.course_title, row.position_title].join(" ").toLowerCase().includes(q));
  }, [payload?.rows, query]);

  const summary = payload?.summary;

  return (
    <AppShell title="Монитор прогресса" subtitle="Сводка по отделам, командам и сотрудникам в стиле кабинета руководителя">
      <section className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">HR и менеджеры видят общий срез обучения, отставания по спринтам и роли сотрудников в команде.</p>
          </div>
          <button
            className="btn-secondary"
            onClick={async () => {
              const token = getToken();
              if (!token) {
                toast.error("Нужно войти в систему");
                return;
              }
              const response = await fetch(api.monitorExportUrl(departmentId || undefined), { headers: { Authorization: `Bearer ${token}` } });
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "alrosa-monitor.xlsx";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Скачать Excel-отчёт
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {[
            { label: "Отстают на 3+ спринта", value: summary?.critical ?? 0, key: "critical" },
            { label: "Отстают на 1–2 спринта", value: summary?.warning ?? 0, key: "warning" },
            { label: "Успевают", value: summary?.ok ?? 0, key: "ok" },
            { label: "Обучение завершено", value: summary?.completed ?? 0, key: "completed" },
            { label: "Ещё не начали", value: summary?.not_started ?? 0, key: "not_started" },
          ].map((item) => (
            <div key={item.key} className="rounded-3xl border border-slate-200 p-4">
              <div className={`badge ${statusStyles[item.key]}`}>{item.value}</div>
              <div className="mt-3 text-sm font-medium text-slate-700">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1.3fr]">
          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">Отделы</div>
            <div className="mt-3 space-y-3">
              {payload?.departments.map((dep) => (
                <button
                  key={dep.id ?? dep.name}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${departmentId === dep.id ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}
                  onClick={() => {
                    const next = departmentId === dep.id ? "" : dep.id ?? "";
                    setDepartmentId(next);
                    void load(next || undefined);
                  }}
                >
                  <div>
                    <div className="font-medium text-slate-900">{dep.name ?? "Без названия"}</div>
                    <div className="text-sm text-slate-500">{dep.teams} команд</div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">{dep.employees}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">Команды</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {payload?.teams.map((team, index) => (
                <div key={team.team_name ?? `team-${index}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-slate-900"><Users className="h-4 w-4" /> {team.team_name ?? "Без команды"}</div>
                  <div className="mt-2 text-sm text-slate-500">{team.departments?.join(", ")}</div>
                  <div className="mt-3 text-xl font-semibold text-slate-900">{team.employees}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 card card-pad">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-slate-200 px-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Поиск по ФИО, отделу, команде, роли или курсу" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {departmentId ? (
            <button className="btn-secondary" onClick={() => { setDepartmentId(""); void load(); }}>Сбросить фильтр</button>
          ) : null}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="pb-3 pr-4">Сотрудник</th>
                <th className="pb-3 pr-4">Отдел / команда</th>
                <th className="pb-3 pr-4">Курс</th>
                <th className="pb-3 pr-4">Последняя активность</th>
                <th className="pb-3 pr-4">Прогресс</th>
                <th className="pb-3 pr-4">Выпуск по плану</th>
                <th className="pb-3 pr-4">Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.user_id} className="border-b border-slate-100 align-top">
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-slate-900">{row.employee_name}</div>
                    <div className="text-xs text-slate-500">{row.position_title}</div>
                  </td>
                  <td className="py-4 pr-4">
                    <div>{row.department_name}</div>
                    <div className="text-xs text-slate-500">{row.team_name}</div>
                  </td>
                  <td className="py-4 pr-4">{row.course_title}</td>
                  <td className="py-4 pr-4">{row.last_activity}</td>
                  <td className="py-4 pr-4">
                    <div className="font-medium text-slate-900">{row.progress_percent}%</div>
                    <div className="mt-2 h-2 w-32 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${row.status_group === "critical" ? "bg-rose-500" : row.status_group === "warning" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.max(row.progress_percent, 6)}%` }} />
                    </div>
                  </td>
                  <td className="py-4 pr-4">{row.planned_completion || "—"}</td>
                  <td className="py-4 pr-4">
                    <span className={`badge ${statusStyles[row.status_group] || statusStyles.not_started}`}>{row.status}</span>
                    {row.sprint_lag > 0 ? (
                      <div className="mt-1 flex items-center gap-1 text-xs text-rose-600"><AlertCircle className="h-3 w-3" /> Было {row.sprint_lag} перехода по спринтам</div>
                    ) : row.status_group === "ok" || row.status_group === "completed" ? (
                      <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" /> В графике</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
