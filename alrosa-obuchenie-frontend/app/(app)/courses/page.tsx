"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoader } from "@/components/common/page-loader";
import { StatusBadge } from "@/components/common/status-badge";
import { api, ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listCourses()
      .then(setCourses)
      .catch((error) => {
        const message = error instanceof ApiError ? error.detail : "Не удалось загрузить каталог";
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const matchesQuery =
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        (course.description || "").toLowerCase().includes(query.toLowerCase());
      const matchesType = type === "all" || course.course_type === type;
      return matchesQuery && matchesType;
    });
  }, [courses, query, type]);

  return (
    <AppShell title="Курсы" subtitle="Внутренние и внешние программы обучения для сотрудников Алроса">
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <section className="card card-pad">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-11"
                  placeholder="Поиск курса по названию или описанию"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">Все типы</option>
                <option value="internal">Внутренние</option>
                <option value="external">Внешние</option>
              </select>
            </div>
          </section>

          <section className="mt-6">
            {filtered.length === 0 ? (
              <EmptyState
                title="Курсы не найдены"
                description="Попробуй изменить фильтр или поисковую строку. Каталог подгружается из backend FastAPI."
              />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((course) => (
                  <article key={course.id} className="card card-pad flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.course_type}</p>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">{course.title}</h3>
                      </div>
                      <StatusBadge status={course.status} />
                    </div>
                    <p className="mt-4 flex-1 text-sm text-slate-500">
                      {course.description || "Доступный курс для развития компетенций, soft skills и цифровой эффективности."}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {course.course_type === "external" ? "Через согласование" : "Моментальная запись"}
                      </span>
                      <Link href={`/courses/${course.id}`} className="btn-primary">
                        Подробнее
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
