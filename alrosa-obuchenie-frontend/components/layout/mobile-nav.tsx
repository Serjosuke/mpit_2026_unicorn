"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardCheck, Home, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: Home, label: "Главная" },
  { href: "/courses", icon: BookOpen, label: "Курсы" },
  { href: "/my-learning", icon: ClipboardCheck, label: "Обучение" },
  { href: "/profile", icon: UserCircle2, label: "Профиль" }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden">
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
