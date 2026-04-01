"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CheckSquare, LayoutDashboard, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Главная" },
  { href: "/courses", icon: BookOpen, label: "Каталог" },
  { href: "/my-learning", icon: CheckSquare, label: "Мои" },
  { href: "/profile", icon: UserCircle2, label: "Профиль" }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-xs font-medium transition",
                active ? "bg-brand-50 text-brand-700" : "text-slate-500"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
