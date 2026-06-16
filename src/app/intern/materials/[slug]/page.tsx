import { notFound } from "next/navigation";
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

  // Build same-origin proxy URLs for every slide.
  // The /api/intern/slide route fetches from Supabase server-side (no CORS),
  // so SlideViewer can draw them on <canvas> without browser security errors.
  const slideUrls: Record<number, string> = {};
  for (const slide of material.slides) {
    slideUrls[slide.slideNumber] = `/api/intern/slide?materialId=${material.id}&slideNumber=${slide.slideNumber}`;
  }

  const lastSlideViewed = material.progress[0]?.lastSlide || 1;

  return (
    <SlideViewer
      material={material}
      slides={material.slides}
      internId={intern.id}
      internEmail={intern.personalEmail}
      lastSlideViewed={lastSlideViewed}
      slideUrls={slideUrls}
    />
  );
}
