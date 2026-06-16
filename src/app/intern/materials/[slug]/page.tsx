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
  const material = await prisma.studyMaterial.findUnique({
    where: { slug },
  });
  return {
    title: material?.title || "Study Material",
  };
}

export default async function MaterialPage({ params }: PageProps) {
  const { intern } = await requireActiveIntern();
  const { slug } = await params;

  // Fetch material
  const material = await prisma.studyMaterial.findUnique({
    where: { slug },
    include: {
      slides: {
        orderBy: { slideNumber: "asc" },
      },
      progress: {
        where: { internId: intern.id },
        take: 1,
      },
    },
  });

  if (!material) notFound();

  // Check department access
  if (
    material.audienceDepartments &&
    !material.audienceDepartments.includes(intern.department)
  ) {
    notFound();
  }

  if (!material.isActive) {
    notFound();
  }

  const progress = material.progress[0];
  const lastSlideViewed = progress?.lastSlide || 1;

  return (
    <SlideViewer
      material={material}
      slides={material.slides}
      internId={intern.id}
      internEmail={intern.personalEmail}
      lastSlideViewed={lastSlideViewed}
    />
  );
}
