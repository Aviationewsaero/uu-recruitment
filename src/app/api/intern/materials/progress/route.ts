import { NextRequest, NextResponse } from "next/server";
import { getInternSession } from "@/lib/intern-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getInternSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { materialId, lastSlide, slidesViewed } = await req.json();

    if (!materialId || !lastSlide) {
      return NextResponse.json(
        { error: "materialId and lastSlide required" },
        { status: 400 }
      );
    }

    // Upsert progress
    const progress = await prisma.internProgress.upsert({
      where: {
        internId_materialId: {
          internId: session.internId,
          materialId,
        },
      },
      create: {
        internId: session.internId,
        materialId,
        lastSlide,
        slidesViewed: slidesViewed || lastSlide,
      },
      update: {
        lastSlide,
        slidesViewed: slidesViewed || lastSlide,
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
