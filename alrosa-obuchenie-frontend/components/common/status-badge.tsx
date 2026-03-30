import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const className =
    status === "approved" || status === "completed" || status === "published"
      ? "bg-emerald-50 text-emerald-700"
      : status.includes("rejected") || status === "cancelled"
        ? "bg-rose-50 text-rose-700"
        : status === "in_progress" || status.includes("pending")
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return <span className={cn("badge", className)}>{status}</span>;
}
