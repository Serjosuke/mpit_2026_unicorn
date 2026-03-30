"use client";

import { Bell, Search } from "lucide-react";

import { initials } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useApp();

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-brand-700">Алроса Обучение</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">Поиск по курсам и статусам</span>
        </div>
        <div className="relative rounded-2xl border border-slate-200 bg-white p-3">
          <Bell className="h-5 w-5 text-slate-500" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-2 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-sm font-bold">
            {initials(user?.first_name, user?.last_name)}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-xs text-white/70">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
