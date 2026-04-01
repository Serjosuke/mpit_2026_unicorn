"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
<<<<<<< HEAD
import { BookOpen, CheckSquare, LayoutDashboard, ShieldCheck, UserCircle2, Wrench } from "lucide-react";
=======
import { BookOpen, CheckSquare, LayoutDashboard, UserCircle2 } from "lucide-react";
>>>>>>> d839566c6f869da06a6c368782231753931b1123

import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

<<<<<<< HEAD
=======
const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Главная" },
  { href: "/courses", icon: BookOpen, label: "Каталог" },
  { href: "/my-learning", icon: CheckSquare, label: "Мои" },
  { href: "/profile", icon: UserCircle2, label: "Профиль" }
];

>>>>>>> d839566c6f869da06a6c368782231753931b1123
export function MobileNav() {
  const pathname = usePathname();
  const { user } = useApp();

  const items = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Главная" },
    { href: "/courses", icon: BookOpen, label: "Каталог" },
    { href: "/my-learning", icon: CheckSquare, label: "Мои" },
    ...((user?.role === "hr" || user?.role === "admin" || user?.role === "manager")
      ? [{ href: "/hr-dashboard", icon: ShieldCheck, label: user?.role === "manager" ? "Команда" : "HR" }]
      : []),
    ...((user?.role === "manager") ? [{ href: "/course-builder", icon: Wrench, label: "Курс" }] : []),
    { href: "/profile", icon: UserCircle2, label: "Профиль" }
  ];

  return (
<<<<<<< HEAD
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
=======
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 gap-1">
>>>>>>> d839566c6f869da06a6c368782231753931b1123
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-medium transition sm:text-xs",
                active ? "bg-brand-50 text-brand-700" : "text-slate-500"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
