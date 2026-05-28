import { SkeletonPageHeader, SkeletonTable } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <SkeletonPageHeader />
      <SkeletonTable rows={15} />
    </div>
  );
}
