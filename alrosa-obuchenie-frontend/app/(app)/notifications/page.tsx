"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setNotifications(await api.myNotifications());
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось загрузить уведомления";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
      toast.success("Уведомление отмечено прочитанным");
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось обновить уведомление";
      toast.error(message);
    }
  }

  return (
    <AppShell title="Уведомления" subtitle="Все системные сообщения, события обучения и статусы workflow">
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card card-pad">
              <div className="skeleton h-5 w-40" />
              <div className="mt-3 skeleton h-4 w-full" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="card card-pad text-sm text-slate-500">Пока уведомлений нет.</div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className={`card card-pad ${item.is_read ? "opacity-80" : ""}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-3xl p-3 ${item.is_read ? "bg-slate-100 text-slate-600" : "bg-brand-50 text-brand-700"}`}>
                      <BellRing className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-500">{formatDateTime(item.created_at)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{item.body}</p>
                </div>
                {!item.is_read ? (
                  <button className="btn-primary" onClick={() => markRead(item.id)}>
                    Отметить прочитанным
                  </button>
                ) : (
                  <span className="badge bg-emerald-50 text-emerald-700">Прочитано</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
