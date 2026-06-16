import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireActiveIntern } from "@/lib/auth-intern";
import { prisma } from "@/lib/prisma";
import { SlideViewer } from "./SlideViewer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const material = await prisma.studyMaterial.findUnique({ where: { slug } });
  return { title: material?.title || "Study Material" };
}

export default async function MaterialPage({ params }: PageProps) {
  const { intern } = await requireActiveIntern();
  const { slug } = await params;

  const material = await prisma.studyMaterial.findUnique({
    where: { slug },
    include: {
      slides: { orderBy: { slideNumber: "asc" } },
      progress: { where: { internId: intern.id }, take: 1 },
    },
  });

  if (!material) notFound();

  if (
    material.audienceDepartments &&
    !material.audienceDepartments.includes(intern.department)
  ) {
    notFound();
  }

  if (!material.isActive) notFound();

  // Generate signed URLs server-side (service role → works for private buckets)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const paths = material.slides.map((s) => s.imagePath);
  const { data: signedData, error: signedError } = await supabase.storage
    .from("study-materials")
    .createSignedUrls(paths, 3600); // 1-hour expiry

  if (signedError) {
    console.error("Failed to generate signed URLs:", signedError);
  }

  // Map imagePath → signedUrl
  const signedUrls: Record<string, string> = {};
  for (const item of signedData ?? []) {
    if (item.path && item.signedUrl) {
      signedUrls[item.path] = item.signedUrl;
    }
  }

  const lastSlideViewed = material.progress[0]?.lastSlide || 1;

  return (
    <SlideViewer
      material={material}
      slides={material.slides}
      internId={intern.id}
      internEmail={intern.personalEmail}
      lastSlideViewed={lastSlideViewed}
      signedUrls={signedUrls}
    />
  );
}
