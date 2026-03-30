export function PageLoader() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card card-pad">
            <div className="skeleton h-4 w-24" />
            <div className="mt-4 skeleton h-8 w-16" />
            <div className="mt-3 skeleton h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card card-pad xl:col-span-2">
          <div className="skeleton h-6 w-40" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 p-4">
                <div className="skeleton h-5 w-36" />
                <div className="mt-3 skeleton h-4 w-full" />
                <div className="mt-2 skeleton h-4 w-3/4" />
                <div className="mt-4 skeleton h-10 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <div className="skeleton h-6 w-32" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                <div className="skeleton h-4 w-24" />
                <div className="mt-2 skeleton h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
