"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { useApp } from "@/components/providers/app-provider";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { ExternalRequest } from "@/lib/types";
import { requestStatusLabel } from "@/lib/utils";

export default function ApprovalsPage() {
  const { user } = useApp();
  const [items, setItems] = useState<ExternalRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.pendingExternalRequests());
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось загрузить согласования";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(kind: "approve" | "reject", id: string) {
    setBusyId(id + kind);
    try {
      if (user?.role === "manager" || user?.role === "admin") {
        if (kind === "approve") {
          await api.managerApprove(id, "Согласовано через frontend");
        } else {
          await api.managerReject(id, "Отклонено через frontend");
        }
      } else if (user?.role === "hr") {
        if (kind === "approve") {
          await api.hrApprove(id, "Согласовано через frontend");
        } else {
          await api.hrReject(id, "Отклонено через frontend");
        }
      }
      toast.success(kind === "approve" ? "Заявка согласована" : "Заявка отклонена");
      await load();
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "Не удалось обработать заявку";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Согласования" subtitle="Рабочая зона руководителя и HR для внешних заявок сотрудников">
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card card-pad">
              <div className="skeleton h-5 w-48" />
              <div className="mt-3 skeleton h-4 w-full" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="card card-pad text-sm text-slate-500">Нет заявок, ожидающих решения.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card card-pad">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.provider_name}</p>
                  <p className="mt-2 text-sm text-slate-600">{requestStatusLabel(item.status)}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Стоимость: {item.cost_amount} {item.cost_currency}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary" onClick={() => act("approve", item.id)} disabled={busyId === item.id + "approve"}>
                    {busyId === item.id + "approve" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Согласовать
                  </button>
                  <button className="btn-danger" onClick={() => act("reject", item.id)} disabled={busyId === item.id + "reject"}>
                    {busyId === item.id + "reject" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                    Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
