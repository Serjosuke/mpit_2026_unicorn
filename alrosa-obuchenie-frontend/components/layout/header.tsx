"use client";

import { Bell, Search } from "lucide-react";

import { initials } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useApp();

  return (
    <header className="mb-5 grid gap-4 rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur xl:grid-cols-[1fr_auto]">
      <div>
        <p className="text-sm font-medium text-blue-700">Алроса Обучение</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900 lg:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 xl:justify-end">
        <div className="hidden min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">Поиск по курсам, людям и статусам</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <Bell className="h-5 w-5 text-slate-500" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-2 text-white">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-sm font-bold">{initials(user?.first_name, user?.last_name)}</div>
          <div>
            <div className="text-sm font-semibold">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-white/70">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
