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

    const { materialId, slideNumber } = await req.json();

    if (!materialId || !slideNumber) {
      return NextResponse.json(
        { error: "materialId and slideNumber required" },
        { status: 400 }
      );
    }

    // Get client IP (from Vercel headers)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    // Get user agent
    const userAgent = req.headers.get("user-agent") || undefined;

    // Log the view
    await prisma.internViewLog.create({
      data: {
        internId: session.internId,
        materialId,
        slideNumber: parseInt(slideNumber, 10),
        ipAddress: ip,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("View log error:", error);
    return NextResponse.json(
      { error: "Failed to log view" },
      { status: 500 }
    );
  }
}
