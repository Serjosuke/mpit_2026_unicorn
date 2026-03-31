export function PageLoader() {
  return (
    <div className="space-y-6 fade-up">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card card-pad">
            <div className="skeleton h-4 w-24" />
            <div className="mt-4 skeleton h-9 w-24" />
            <div className="mt-3 skeleton h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="card card-pad">
          <div className="skeleton h-8 w-56" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 p-4">
                <div className="skeleton h-5 w-40" />
                <div className="mt-3 skeleton h-4 w-full" />
                <div className="mt-2 skeleton h-4 w-4/5" />
                <div className="mt-6 skeleton h-11 w-36" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card card-pad">
              <div className="skeleton h-5 w-40" />
              <div className="mt-4 skeleton h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
