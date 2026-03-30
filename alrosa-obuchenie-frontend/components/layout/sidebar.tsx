"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Home,
  LogOut,
  ShieldCheck,
  UserCircle2
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";

const commonItems = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/courses", label: "Курсы", icon: BookOpen },
  { href: "/my-learning", label: "Мое обучение", icon: ClipboardCheck },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/certificates", label: "Сертификаты", icon: BadgeCheck },
  { href: "/notifications", label: "Уведомления", icon: Bell },
  { href: "/profile", label: "Личный кабинет", icon: UserCircle2 }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useApp();

  const items = [...commonItems];
  if (user?.role === "manager" || user?.role === "hr" || user?.role === "admin") {
    items.splice(5, 0, { href: "/approvals", label: "Согласования", icon: ShieldCheck });
  }

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-6 space-y-4">
        <div className="card card-pad bg-slate-950 text-white">
          <div className="mb-4 inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            Алроса Обучение
          </div>
          <h1 className="text-2xl font-bold">Единая среда обучения</h1>
          <p className="mt-2 text-sm text-white/70">
            Курсы, внешнее обучение, сертификаты, уведомления и планирование в одном окне.
          </p>
        </div>

        <nav className="card card-pad flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </nav>
      </div>
    </aside>
  );
}
