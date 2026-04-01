import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  approved: "Согласовано",
  completed: "Завершено",
  published: "Опубликован",
  in_progress: "В процессе",
  pending_manager_approval: "Ждёт руководителя",
  pending_hr_approval: "Ждёт HR",
  rejected_by_manager: "Отклонено руководителем",
  rejected_by_hr: "Отклонено HR",
  warning: "Скоро дедлайн",
  danger: "Просрочено",
  done: "Выполнено",
  normal: "По плану",
};

export function StatusBadge({ status }: { status: string }) {
  const className =
    ["approved", "completed", "published", "done"].includes(status)
      ? "bg-emerald-50 text-emerald-700"
      : status.includes("rejected") || status === "cancelled" || status === "danger"
        ? "bg-rose-50 text-rose-700"
        : status === "in_progress" || status.includes("pending") || status === "warning"
          ? "bg-amber-50 text-amber-700"
          : status === "normal"
            ? "bg-blue-50 text-blue-700"
            : "bg-slate-100 text-slate-700";

  return <span className={cn("badge", className)}>{labels[status] ?? status}</span>;
}
