"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, CheckCheck, Clock10, Link2, Unplug } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import type { CalendarEvent, OutlookStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [status, setStatus] = useState<OutlookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, statusData] = await Promise.all([api.myCalendarEvents(), api.outlookStatus()]);
      setEvents(eventsData);
      setStatus(statusData);
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось загрузить календарь";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outlook = params.get("outlook");
    if (outlook === "connected") {
      toast.success("Outlook Calendar подключён");
      window.history.replaceState({}, document.title, window.location.pathname);
      loadData();
    }
    if (outlook === "error") {
      toast.error(`Ошибка подключения Outlook: ${params.get("reason") || "unknown"}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    setSyncLoading(true);
    try {
      const { authorize_url } = await api.outlookConnectUrl();
      window.location.href = authorize_url;
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось начать подключение Outlook";
      toast.error(message);
      setSyncLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setSyncLoading(true);
    try {
      await api.outlookDisconnect();
      toast.success("Outlook отключён");
      await loadData();
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось отключить Outlook";
      toast.error(message);
    } finally {
      setSyncLoading(false);
    }
  };

  const syncedCount = useMemo(() => events.filter((item) => item.sync_provider === "outlook" && item.sync_status === "synced").length, [events]);

  return (
    <AppShell title="Календарь" subtitle="Системный календарь обучения с реальной интеграцией Microsoft Graph / Outlook Calendar">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card card-pad">
          <div className="flex items-center gap-3">
            <div className="rounded-3xl bg-brand-50 p-3 text-brand-700">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">События обучения</h3>
              <p className="text-sm text-slate-500">После согласования внешнего курса событие появляется в системе и синхронизируется с Outlook, если пользователь подключил аккаунт</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 p-4">
                  <div className="skeleton h-5 w-32" />
                  <div className="mt-3 skeleton h-4 w-full" />
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                Пока календарных событий нет. После согласования внешнего курса они появятся здесь.
              </div>
            ) : (
              events.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{item.source}</p>
                      <h4 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h4>
                      {item.description ? <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{item.description}</p> : null}
                      {item.meeting_url ? (
                        <a className="mt-3 inline-flex text-sm font-medium text-brand-700 underline underline-offset-4" href={item.meeting_url} target="_blank" rel="noreferrer">
                          Открыть в Outlook
                        </a>
                      ) : null}
                    </div>
                    <span className="badge bg-slate-100 text-slate-700">{item.sync_provider}:{item.sync_status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {item.starts_at ? formatDate(item.starts_at) : "Дата будет назначена"}
                    {item.ends_at ? ` — ${formatDate(item.ends_at)}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-brand-700" />
                <h3 className="text-xl font-bold text-slate-900">Outlook Calendar</h3>
              </div>
              {status?.connected ? (
                <button className="btn-secondary" onClick={handleDisconnect} disabled={syncLoading}>
                  <Unplug className="h-4 w-4" /> Отключить
                </button>
              ) : (
                <button className="btn-primary" onClick={handleConnect} disabled={syncLoading || !status?.configured}>
                  <Link2 className="h-4 w-4" /> Подключить
                </button>
              )}
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Статус: <span className="font-semibold text-slate-900">{status?.connected ? "подключён" : "не подключён"}</span></p>
              <p>Конфиг backend: <span className="font-semibold text-slate-900">{status?.configured ? "готов" : "не заполнен"}</span></p>
              {status?.outlook_email ? <p>Аккаунт: <span className="font-semibold text-slate-900">{status.outlook_email}</span></p> : null}
              {status?.expires_at ? <p>Токен до: <span className="font-semibold text-slate-900">{formatDate(status.expires_at)}</span></p> : null}
              <p>Синхронизировано событий: <span className="font-semibold text-slate-900">{syncedCount}</span></p>
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-3">
              <Clock10 className="h-5 w-5 text-brand-700" />
              <h3 className="text-xl font-bold text-slate-900">Как это работает</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              После HR approve создаётся системное событие. Если сотрудник заранее подключил Outlook, backend получает OAuth access token и создаёт событие через Microsoft Graph.
            </p>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-3">
              <CheckCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-xl font-bold text-slate-900">Что уже готово</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• OAuth authorization code flow</li>
              <li>• хранение access / refresh token в БД</li>
              <li>• обновление access token по refresh token</li>
              <li>• создание события в Outlook после согласования</li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
