"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useApp } from "@/components/providers/app-provider";
import { formatDate, initials } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useApp();

  return (
    <AppShell title="Личный кабинет" subtitle="Профиль сотрудника, роль в системе и базовая информация по аккаунту">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="card card-pad">
          <div className="grid place-items-center">
            <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-slate-950 text-2xl font-bold text-white">
              {initials(user?.first_name, user?.last_name)}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              {user?.last_name} {user?.first_name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            <div className="mt-4 badge bg-brand-50 text-brand-700">{user?.role}</div>
          </div>
        </section>

        <section className="card card-pad">
          <h3 className="text-xl font-bold text-slate-900">Информация о сотруднике</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Info label="Имя" value={user?.first_name} />
            <Info label="Фамилия" value={user?.last_name} />
            <Info label="Отчество" value={user?.middle_name || "—"} />
            <Info label="Email" value={user?.email} />
            <Info label="Роль" value={user?.role} />
            <Info label="Дата регистрации" value={formatDate(user?.created_at)} />
            <Info label="Активен" value={user?.is_active ? "Да" : "Нет"} />
            <Info label="Подтвержден" value={user?.is_verified ? "Да" : "Нет"} />
          </div>

          <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Здесь уже готов личный кабинет сотрудника. Когда backend расширится, сюда можно добавить департамент, менеджера, историю развития, выгрузку сертификатов и настройки интеграции с Outlook.
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value || "—"}</p>
    </div>
  );
}
