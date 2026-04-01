"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, CheckCheck, Link2, RefreshCcw, Unplug, BellRing } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import type { CalendarEvent, OutlookStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function priorityLabel(priority = 50) {
  if (priority >= 90) return "высокий приоритет";
  if (priority >= 50) return "обычный приоритет";
  return "низкий приоритет";
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [status, setStatus] = useState<OutlookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, statusData] = await Promise.all([api.myCalendarEvents(), api.outlookStatus()]);
      setEvents(eventsData.sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.starts_at || "").localeCompare(String(b.starts_at || ""))));
      setStatus(statusData);
    }
    catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить календарь"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outlook = params.get("outlook");
    if (outlook === "connected") {
      toast.success("Outlook подключён и события внутренних курсов пересобраны");
      window.history.replaceState({}, document.title, window.location.pathname);
      loadData();
    }
  }, []);

  const handleConnect = async () => { setSyncLoading(true); try { const { authorize_url } = await api.outlookConnectUrl(); window.location.href = authorize_url; } catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось подключить Outlook"); setSyncLoading(false); } };
  const handleDisconnect = async () => { setSyncLoading(true); try { await api.outlookDisconnect(); toast.success("Outlook отключён"); await loadData(); } catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось отключить Outlook"); } finally { setSyncLoading(false); } };
  const handleResync = async () => { setSyncLoading(true); try { const result = await api.resyncInternalOutlook(); toast.success(`Пересобрано событий: ${result.created}, синхронизировано: ${result.synced}`); await loadData(); } catch (error) { toast.error(error instanceof ApiError ? error.detail : "Не удалось пересобрать календарь"); } finally { setSyncLoading(false); } };

  const syncedCount = useMemo(() => events.filter((item) => item.sync_provider === "outlook" && item.sync_status === "synced").length, [events]);
  const remindersCount = useMemo(() => events.filter((item) => item.is_reminder_only).length, [events]);

  return (
    <AppShell title="Календарь">
      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="card card-pad">
          <div className="flex items-center gap-3"><div className="rounded-3xl bg-blue-50 p-3 text-blue-700"><CalendarRange className="h-5 w-5" /></div><div><h3 className="text-xl font-bold">События обучения</h3><p className="text-sm text-slate-500">Расписание внутренних групп, уроков, внешних курсов и напоминаний по срокам.</p></div></div>
          <div className="mt-6 space-y-3">
            {loading ? Array.from({ length: 6 }).map((_, idx) => <div key={idx} className="rounded-3xl border border-slate-200 p-4"><div className="skeleton h-5 w-64" /><div className="mt-3 skeleton h-4 w-48" /></div>) : null}
            {!loading && events.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Пока календарных событий нет.</div> : null}
            {!loading && events.map((item) => (
              <div key={item.id} className="rounded-[28px] border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold">{item.title}</div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${(item.priority || 0) >= 90 ? "bg-brand-100 text-brand-700" : item.is_reminder_only ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{priorityLabel(item.priority)}</span>
                      {item.is_reminder_only ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">напоминание</span> : null}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                    <div className="mt-3 text-sm text-slate-600">{formatDateTime(item.starts_at)} — {formatDateTime(item.ends_at)}</div>
                    {item.location ? <div className="mt-1 text-sm text-slate-500">{item.location}</div> : null}
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>{item.source}</div>
                    <div className="mt-1">{item.event_kind} · {item.sync_provider}: {item.sync_status}</div>
                    {item.meeting_url ? <a className="mt-2 inline-flex items-center gap-1 text-blue-600" href={item.meeting_url} target="_blank"><Link2 className="h-3.5 w-3.5" />Открыть в Outlook</a> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-6">
          <section className="card card-pad">
            <h3 className="text-xl font-bold">Outlook Calendar</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div>Статус: <span className="font-semibold">{status?.connected ? "подключён" : "не подключён"}</span></div>
              <div>Конфиг backend: <span className="font-semibold">{status?.configured ? "готов" : "не настроен"}</span></div>
              <div>Аккаунт: <span className="font-semibold">{status?.outlook_email || "—"}</span></div>
              <div>Синхронизировано событий: <span className="font-semibold">{syncedCount}</span></div>
              <div>Напоминаний по внешним курсам: <span className="font-semibold">{remindersCount}</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {status?.connected ? <button onClick={handleDisconnect} className="btn-secondary"><Unplug className="mr-2 h-4 w-4" />Отключить</button> : <button onClick={handleConnect} className="btn-primary" disabled={syncLoading}>Подключить Outlook</button>}
              <button onClick={handleResync} className="btn-secondary" disabled={syncLoading}><RefreshCcw className="mr-2 h-4 w-4" />Пересобрать события</button>
            </div>
          </section>
          <section className="card card-pad">
            <div className="flex items-center gap-3"><BellRing className="h-5 w-5 text-amber-600" /><h3 className="text-xl font-bold">Логика приоритета</h3></div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• внутренние офлайн и групповые курсы имеют высокий приоритет;</li>
              <li>• внешний онлайн-курс не забивает слот, если уже есть внутреннее обучение;</li>
              <li>• при конфликте система ставит напоминание по сроку завершения внешнего курса;</li>
              <li>• HR видит только прогресс и сроки, а сотрудник проходит курс по внешней ссылке.</li>
            </ul>
          </section>
          <section className="card card-pad">
            <div className="flex items-center gap-3"><CheckCheck className="h-5 w-5 text-emerald-600" /><h3 className="text-xl font-bold">Как работает</h3></div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• внутренние курсы можно назначать группами;</li>
              <li>• офлайн-группы создают фиксированные слоты в календаре;</li>
              <li>• внешний курс — это ссылка, краткое описание и срок выполнения;</li>
              <li>• HR отслеживает ход обучения через карточки сотрудников и монитор.</li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
