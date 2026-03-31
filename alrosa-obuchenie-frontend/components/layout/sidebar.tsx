"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { BadgeCheck, Bell, BookOpen, CalendarDays, ChevronDown, ClipboardCheck, FolderKanban, Home, LineChart, LogOut, ShieldCheck, UserCircle2, Users2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useApp();
  const [openLearning, setOpenLearning] = useState(true);

  const topItems = useMemo(() => {
    const items = [{ href: "/dashboard", label: "Главная", icon: Home }];
    if (user?.role === "manager" || user?.role === "hr" || user?.role === "admin") {
      items.push({ href: "/hr-dashboard", label: user?.role === "manager" ? "Монитор команды" : "HR-монитор", icon: LineChart });
    }
    if (user?.role === "hr" || user?.role === "admin") {
      items.push({ href: "/people", label: "Сотрудники", icon: Users2 });
    }
    return items;
  }, [user?.role]);

  const learningItems = [
    { href: "/courses", label: "Каталог", hint: "все курсы", icon: BookOpen },
    { href: "/my-learning", label: "Мои курсы", hint: "трек обучения", icon: ClipboardCheck },
    { href: "/calendar", label: "Календарь", hint: "сроки и Outlook", icon: CalendarDays },
    { href: "/certificates", label: "Сертификаты", hint: "документы", icon: BadgeCheck },
    { href: "/notifications", label: "Активные задачи", hint: "события и напоминания", icon: FolderKanban },
  ];

  const profileItems = [
    { href: "/profile", label: "Профиль", icon: UserCircle2 },
    ...(user?.role === "manager" || user?.role === "hr" || user?.role === "admin" ? [{ href: "/approvals", label: "Согласования", icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="hidden w-80 shrink-0 lg:block">
      <div className="sticky top-4 space-y-4">
        <div className="card card-pad bg-[#18181d] text-white">
          <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">Цифровая среда обучения</div>
          <h1 className="mt-4 text-2xl font-bold">Алроса LearnFlow</h1>
          <p className="mt-2 text-sm leading-6 text-white/70">Курсы, дедлайны, сертификаты, монитор прогресса и календарь Outlook в едином кабинете.</p>
        </div>

        <nav className="card card-pad flex flex-col gap-2">
          {topItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition", active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button onClick={() => setOpenLearning((s) => !s)} className="mt-1 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
            <span className="flex items-center gap-3"><BookOpen className="h-4 w-4" />Обучение</span>
            <ChevronDown className={cn("h-4 w-4 transition", openLearning && "rotate-180")} />
          </button>
          {openLearning ? learningItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={cn("ml-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition", active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}>
                <Icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.hint}</div>
                </div>
              </Link>
            );
          }) : null}

          {profileItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition", active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}>
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}

          <button onClick={signOut} className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50">
            <LogOut className="h-4 w-4" />Выйти
          </button>
        </nav>
      </div>
    </aside>
  );
}
