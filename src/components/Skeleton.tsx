// Reusable skeleton primitives for loading states across admin / recruiter.
// Plain Tailwind, no client JS — these render as part of the prerendered
// loading.tsx fallback so navigation feels instant.

export function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-brand-border/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-brand-border bg-brand-surface p-5 ${className}`}
    >
      <SkeletonBar className="h-3 w-24" />
      <SkeletonBar className="mt-3 h-8 w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
      <div className="border-b border-brand-border p-3">
        <SkeletonBar className="h-4 w-40" />
      </div>
      <div className="divide-y divide-brand-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <SkeletonBar className="h-3 w-20" />
            <SkeletonBar className="h-3 flex-1" />
            <SkeletonBar className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <header className="mb-8">
      <SkeletonBar className="h-3 w-32" />
      <SkeletonBar className="mt-2 h-7 w-64" />
    </header>
  );
}
