export default function JobsLoading() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-ink-100 p-5 sm:p-6 flex gap-4 sm:gap-6 animate-pulse">
            <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
              <div className="w-3 h-3 rounded-full bg-ink-100" />
              <div className="w-5 h-3 bg-ink-100 rounded" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-ink-100 rounded" />
                <div className="h-4 w-12 bg-ink-100 rounded" />
              </div>
              <div className="h-6 w-64 bg-ink-100 rounded" />
              <div className="h-4 w-32 bg-ink-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
