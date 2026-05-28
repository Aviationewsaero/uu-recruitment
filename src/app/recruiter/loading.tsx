import { SkeletonBar, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <SkeletonBar className="h-3 w-32" />
      <SkeletonBar className="mt-2 h-7 w-64" />
      <div className="mt-6 grid grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="mt-8 rounded-lg border border-brand-border bg-brand-surface p-6 space-y-3">
        <SkeletonBar className="h-5 w-40" />
        <SkeletonBar className="h-32 w-full" />
        <SkeletonBar className="h-10 w-40" />
      </div>
    </div>
  );
}
