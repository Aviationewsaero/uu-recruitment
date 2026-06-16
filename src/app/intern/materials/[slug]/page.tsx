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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generate signed URLs with image transforms (resize + WebP) for each slide.
  // Supabase serves transformed images only on Pro plan; on free plan it falls back
  // to the original file — still works, just larger.
  const signedUrls: Record<string, string> = {};
  await Promise.all(
    material.slides.map(async (slide) => {
      const { data } = await supabase.storage
        .from("study-materials")
        .createSignedUrl(slide.imagePath, 3600, {
          transform: {
            width: 1280,
            quality: 80,
            resize: "contain",
          },
        });
      if (data?.signedUrl) {
        signedUrls[slide.imagePath] = data.signedUrl;
      }
    })
  );

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
