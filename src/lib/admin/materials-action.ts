"use server";

import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables not set");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function createMaterialAction(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const targetDepts = formData.get("targetDepts") as string;
    const displayOrder = parseInt((formData.get("displayOrder") as string) || "0", 10);

    if (!title) {
      return { success: false, error: "Title is required" };
    }

    // Count slides
    let slideCount = 0;
    const slides: { name: string; file: File }[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("slide_")) {
        slides.push({
          name: key,
          file: value as File,
        });
        slideCount++;
      }
    }

    if (slideCount === 0) {
      return { success: false, error: "At least one slide is required" };
    }

    // Create material record
    const material = await prisma.studyMaterial.create({
      data: {
        title,
        description: description || undefined,
        slug: title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
        audienceDepartments: targetDepts || undefined,
        displayOrder,
        totalSlides: slideCount,
        isActive: true,
      },
    });

    // Upload slides to Supabase Storage
    const uploadedSlides: Array<{ slideNumber: number; imagePath: string }> = [];

    for (let i = 0; i < slides.length; i++) {
      const { file } = slides[i];
      const slideNumber = i + 1;

      // Read file as buffer
      const buffer = await file.arrayBuffer();

      // Upload to Supabase
      const fileName = `${material.id}/${slideNumber}.${file.type.split("/")[1] || "png"}`;
      const path = `study-materials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(path, new Uint8Array(buffer), {
          upsert: false,
        });

      if (uploadError) {
        console.error(`Failed to upload slide ${slideNumber}:`, uploadError);
        // Continue with next slide, we'll mark as error later
        continue;
      }

      uploadedSlides.push({
        slideNumber,
        imagePath: path,
      });
    }

    // Create slide records in DB
    for (const slide of uploadedSlides) {
      await prisma.studyMaterialSlide.create({
        data: {
          materialId: material.id,
          slideNumber: slide.slideNumber,
          imagePath: slide.imagePath,
        },
      });
    }

    // Update total slides count
    await prisma.studyMaterial.update({
      where: { id: material.id },
      data: { totalSlides: uploadedSlides.length },
    });

    return { success: true, materialId: material.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Material creation error:", message);
    return { success: false, error: "Failed to create material" };
  }
}
