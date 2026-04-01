import { ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="rounded-2xl bg-brand-50 p-2 text-brand-700">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}
