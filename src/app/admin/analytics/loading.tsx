import { SkeletonBar, SkeletonCard, SkeletonPageHeader } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="mt-8 rounded-lg border border-brand-border bg-brand-surface p-6">
        <SkeletonBar className="h-4 w-40" />
        <SkeletonBar className="mt-4 h-64 w-full" />
      </div>
    </div>
  );
}
