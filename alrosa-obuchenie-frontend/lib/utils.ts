import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "AA";
}

export function courseStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Черновик",
    published: "Опубликован",
    archived: "Архив"
  };
  return map[status] ?? status;
}

export function requestStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending_manager_approval: "Ожидает руководителя",
    pending_hr_approval: "Ожидает HR",
    approved: "Согласовано",
    rejected_by_manager: "Отклонено руководителем",
    rejected_by_hr: "Отклонено HR",
    completed: "Завершено"
  };
  return map[status] ?? status;
}
