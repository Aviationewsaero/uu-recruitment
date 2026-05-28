import {
  SkeletonCard,
  SkeletonPageHeader,
} from "@/components/Skeleton";

// Streams immediately on /admin navigation — replaces the previous
// blocking server render that made the sidebar feel "hung".
export default function Loading() {
  return (
    <div className="p-8">
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
