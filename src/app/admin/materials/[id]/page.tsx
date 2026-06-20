import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/storage";
import { EditMaterialClient } from "./EditMaterialClient";

export const dynamic = "force-dynamic";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("SUPER_ADMIN");

  const { id } = await params;

  const material = await prisma.studyMaterial.findUnique({
    where: { id },
    include: {
      slides: { orderBy: { slideNumber: "asc" } },
    },
  });

  if (!material) notFound();

  // Generate signed URLs for each slide
  const slidesWithUrls = await Promise.all(
    material.slides.map(async (slide) => ({
      id: slide.id,
      slideNumber: slide.slideNumber,
      imagePath: slide.imagePath,
      signedUrl: await getFileUrl("study-materials", slide.imagePath),
    }))
  );

  return (
    <div className="p-6 lg:p-8">
      <nav className="mb-6 text-xs text-brand-muted flex items-center gap-1.5">
        <Link href="/admin/materials" className="hover:text-brand-blue">
          Study Materials
        </Link>
        <span>/</span>
        <span className="text-brand-text font-medium truncate max-w-xs">{material.title}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Edit module</h1>
        <p className="mt-1 text-sm text-brand-muted">
          {material.slides.length} slide{material.slides.length === 1 ? "" : "s"} ·{" "}
          {material.isActive ? (
            <span className="text-green-600 font-medium">Active</span>
          ) : (
            <span className="text-slate-400 font-medium">Archived</span>
          )}
        </p>
      </header>

      <EditMaterialClient
        material={{
          id: material.id,
          title: material.title,
          description: material.description,
          audienceDepartments: material.audienceDepartments,
          displayOrder: material.displayOrder,
          isActive: material.isActive,
        }}
        slides={slidesWithUrls}
      />
    </div>
  );
}
