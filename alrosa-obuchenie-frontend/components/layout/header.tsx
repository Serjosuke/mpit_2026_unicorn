"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
<<<<<<< HEAD
import { Bell, BookOpen, Calendar, CheckSquare, LayoutDashboard, LogOut, Users } from "lucide-react";
=======
import { Bell, BookOpen, CheckSquare, LayoutDashboard, LogOut, Users, Calendar } from "lucide-react";
>>>>>>> d839566c6f869da06a6c368782231753931b1123

import { useApp } from "@/components/providers/app-provider";
import { cn, initials } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useApp();

  const items = [
    { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
<<<<<<< HEAD
    ...((user?.role === "hr" || user?.role === "admin" || user?.role === "manager")
      ? [{ href: "/hr-dashboard", label: user?.role === "manager" ? "Монитор команды" : "HR-монитор", icon: Users }]
      : []),
=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
    { href: "/courses", label: "Каталог", icon: BookOpen },
    { href: "/my-learning", label: "Мои курсы", icon: CheckSquare },
    { href: "/calendar", label: "Календарь", icon: Calendar },
    ...((user?.role === "hr" || user?.role === "admin" || user?.role === "manager") ? [{ href: "/approvals", label: "Согласования", icon: Bell }] : []),
<<<<<<< HEAD
    ...((user?.role === "manager") ? [{ href: "/course-builder", label: "Конструктор курса", icon: BookOpen }] : []),
=======
>>>>>>> d839566c6f869da06a6c368782231753931b1123
    ...((user?.role === "hr" || user?.role === "admin") ? [{ href: "/people", label: "Сотрудники", icon: Users }] : []),
  ];

  return (
<<<<<<< HEAD
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[84px] items-center justify-between gap-3 py-3 lg:gap-6">
          <div className="flex min-w-0 items-center gap-3 lg:gap-6">
            <Link href="/dashboard" className="shrink-0">
              <div className="flex items-center rounded-2xl px-2 py-2 sm:px-4 sm:py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-black sm:text-sm">АЛРОСА</div>
                <div className="mx-2 my-auto h-[2px] w-5 rounded-2xl bg-red-500 sm:w-7"></div>
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#83D0F5] sm:text-sm">ОБУЧЕНИЕ</div>
              </div>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap lg:flex">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition whitespace-nowrap",
                      active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/notifications" className="hidden rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:bg-slate-50 sm:inline-flex">
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/profile" className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-100 px-2.5 py-2 transition hover:bg-slate-200 sm:px-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-bold text-white">{initials(user?.first_name, user?.last_name)}</div>
              <div className="hidden min-w-0 text-left md:block">
                <div className="truncate text-sm font-semibold text-slate-900">{user?.first_name} {user?.last_name}</div>
                <div className="truncate text-xs text-slate-500">{user?.position_title || user?.role}</div>
              </div>
            </Link>
            <button onClick={signOut} className="hidden rounded-2xl border border-rose-200 px-3 py-2 text-rose-600 transition hover:bg-rose-50 lg:inline-flex">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 lg:hidden">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium whitespace-nowrap transition",
                  active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
=======
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="container-page flex min-h-[76px] items-center justify-between gap-4 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/dashboard" className="shrink-0">
            <div className="rounded-2xl px-4 py-3 flex">
              <div className="text-s font-semibold uppercase tracking-[0.1em] text-black">АЛРОСА</div>
              <div className="w-7 h-[2px] mx-auto bg-red-500 my-auto rounded-2xl"></div>
              <div className="text-s font-semibold uppercase tracking-[0.1em] text-[#83D0F5]">ОБУЧЕНИЕ</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 xl:flex">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition",
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/notifications" className="hidden rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:bg-slate-50 sm:inline-flex">
            <Bell className="h-5 w-5" />
          </Link>
          <Link href="/profile" className="flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-2 transition hover:bg-slate-200">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-sm font-bold text-white">{initials(user?.first_name, user?.last_name)}</div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold text-slate-900">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-slate-500">{user?.position_title || user?.role}</div>
            </div>
          </Link>
          <button onClick={signOut} className="hidden rounded-2xl border border-rose-200 px-3 py-2 text-rose-600 transition hover:bg-rose-50 lg:inline-flex">
            <LogOut className="h-4 w-4" />
          </button>
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        </div>
      </div>
    </header>
  );
}
