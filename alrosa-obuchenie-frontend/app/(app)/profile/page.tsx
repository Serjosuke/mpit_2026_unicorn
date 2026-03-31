"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, BookOpen, Mail, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { api, ApiError } from "@/lib/api";
import type { User, UserProfileSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function ProfilePage() {
  const [me, setMe] = useState<User | null>(null);
  const [summary, setSummary] = useState<UserProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(async (user) => { setMe(user); const summary = await api.userProfileSummary(user.id); setSummary(summary); })
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Не удалось загрузить профиль"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Аккаунт" subtitle="Профиль сотрудника, активные курсы, сертификаты и персональная активность в едином стиле.">
      {loading || !me || !summary ? <div className="card card-pad">Загрузка...</div> : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
          <section className="card card-pad">
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-slate-950 text-2xl font-bold text-white">{me.first_name[0]}{me.last_name[0]}</div>
              <div>
                <h3 className="text-2xl font-bold">{summary.user.full_name}</h3>
                <div className="mt-1 text-sm text-slate-500">{summary.user.position_title || me.role}</div>
                <div className="mt-1 text-sm text-slate-500">{summary.user.department_name || "Без отдела"} · {summary.user.team_name || "Без команды"}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-3xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4" />Контакты</div><div className="mt-2 font-medium">{summary.user.email}</div></div>
              <div className="rounded-3xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><Users className="h-4 w-4" />Последняя активность</div><div className="mt-2 font-medium">{formatDateTime(summary.stats.last_activity_at)}</div></div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Активные курсы</div><div className="mt-2 text-3xl font-bold">{summary.stats.active_courses}</div></div>
              <div className="rounded-3xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Завершено</div><div className="mt-2 text-3xl font-bold">{summary.stats.completed_courses}</div></div>
              <div className="rounded-3xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Сертификаты</div><div className="mt-2 text-3xl font-bold">{summary.stats.certificates}</div></div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="card card-pad">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-600" /><h3 className="text-xl font-bold">Мои курсы</h3></div><Link href="/my-learning" className="btn-secondary">Все курсы</Link></div>
              <div className="mt-4 space-y-3">
                {summary.courses.map((item) => <div key={item.enrollment_id} className="rounded-3xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-semibold">{item.course_title}</div><div className="mt-1 text-sm text-slate-500">Статус: {item.status}</div></div><div className="text-right"><div className="text-sm text-slate-500">Прогресс</div><div className="text-2xl font-bold">{item.progress_percent}%</div></div></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.max(item.progress_percent, 6)}%` }} /></div></div>)}
              </div>
            </div>
            <div className="card card-pad">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Award className="h-5 w-5 text-emerald-600" /><h3 className="text-xl font-bold">Мои сертификаты</h3></div><Link href="/certificates" className="btn-secondary">Открыть раздел</Link></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {summary.certificates.slice(0,4).map((item) => <div key={item.id} className="rounded-3xl border border-slate-200 p-4"><div className="font-semibold">{item.issuer_name || 'Сертификат обучения'}</div><div className="mt-1 text-sm text-slate-500">Источник: {item.source}</div><div className="mt-2 text-sm text-slate-600">Дата: {item.issue_date || '—'}</div></div>)}
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
