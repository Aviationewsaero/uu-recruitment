import { SkeletonBar, SkeletonPageHeader } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <SkeletonPageHeader />
      <div className="rounded-lg border border-brand-border bg-brand-surface p-6 space-y-4">
        <SkeletonBar className="h-10 w-full" />
        <SkeletonBar className="h-10 w-full" />
        <SkeletonBar className="h-40 w-full" />
        <SkeletonBar className="h-10 w-32" />
      </div>
    </div>
  );
}
