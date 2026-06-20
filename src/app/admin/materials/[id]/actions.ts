"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-user";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateMaterialAction(
  materialId: string,
  formData: FormData
) {
  await requireRole("SUPER_ADMIN");

  const title = (formData.get("title") as string).trim();
  const description = (formData.get("description") as string).trim();
  const targetDepts = (formData.get("targetDepts") as string).trim();
  const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10);
  const isActive = formData.get("isActive") === "true";

  if (!title) return { success: false, error: "Title is required" };

  await prisma.studyMaterial.update({
    where: { id: materialId },
    data: {
      title,
      description: description || null,
      slug: title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
      audienceDepartments: targetDepts || null,
      displayOrder,
      isActive,
    },
  });

  revalidatePath("/admin/materials");
  revalidatePath(`/admin/materials/${materialId}`);
  return { success: true };
}

export async function deleteSlideAction(slideId: string, materialId: string) {
  await requireRole("SUPER_ADMIN");

  const slide = await prisma.studyMaterialSlide.findUnique({ where: { id: slideId } });
  if (!slide) return { success: false, error: "Slide not found" };

  // Remove from storage
  await supabase.storage.from("study-materials").remove([slide.imagePath]);

  await prisma.studyMaterialSlide.delete({ where: { id: slideId } });

  // Re-number remaining slides
  const remaining = await prisma.studyMaterialSlide.findMany({
    where: { materialId },
    orderBy: { slideNumber: "asc" },
  });
  for (let i = 0; i < remaining.length; i++) {
    await prisma.studyMaterialSlide.update({
      where: { id: remaining[i].id },
      data: { slideNumber: i + 1 },
    });
  }

  await prisma.studyMaterial.update({
    where: { id: materialId },
    data: { totalSlides: remaining.length },
  });

  revalidatePath(`/admin/materials/${materialId}`);
  return { success: true };
}

export async function addSlidesAction(materialId: string, formData: FormData) {
  await requireRole("SUPER_ADMIN");

  const existing = await prisma.studyMaterialSlide.count({ where: { materialId } });

  const newSlides: { name: string; file: File }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("slide_")) newSlides.push({ name: key, file: value as File });
  }
  if (newSlides.length === 0) return { success: false, error: "No slides provided" };

  let added = 0;
  for (let i = 0; i < newSlides.length; i++) {
    const { file } = newSlides[i];
    const slideNumber = existing + i + 1;
    const ext = file.type.split("/")[1] || "jpg";
    const path = `${materialId}/${slideNumber}.${ext}`;

    const buffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from("study-materials")
      .upload(path, new Uint8Array(buffer), { upsert: true });

    if (error) continue;

    await prisma.studyMaterialSlide.upsert({
      where: { materialId_slideNumber: { materialId, slideNumber } },
      create: { materialId, slideNumber, imagePath: path },
      update: { imagePath: path },
    });
    added++;
  }

  await prisma.studyMaterial.update({
    where: { id: materialId },
    data: { totalSlides: existing + added },
  });

  revalidatePath(`/admin/materials/${materialId}`);
  return { success: true, added };
}

export async function deleteMaterialAction(materialId: string) {
  await requireRole("SUPER_ADMIN");

  const slides = await prisma.studyMaterialSlide.findMany({ where: { materialId } });
  if (slides.length > 0) {
    await supabase.storage
      .from("study-materials")
      .remove(slides.map((s) => s.imagePath));
  }

  await prisma.studyMaterial.delete({ where: { id: materialId } });

  revalidatePath("/admin/materials");
  return { success: true };
}
