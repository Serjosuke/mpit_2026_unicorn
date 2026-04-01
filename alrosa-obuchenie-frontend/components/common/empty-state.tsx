import { BookOpen } from "lucide-react";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card card-pad grid place-items-center text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-700">
        <BookOpen className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
