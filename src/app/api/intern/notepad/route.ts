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

    const { content } = await req.json();

    if (typeof content !== "string") {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    // Upsert notepad
    const notepad = await prisma.internNotepad.upsert({
      where: { internId: session.internId },
      create: {
        internId: session.internId,
        content,
        charCount: content.length,
      },
      update: {
        content,
        charCount: content.length,
      },
    });

    return NextResponse.json({ success: true, notepad });
  } catch (error) {
    console.error("Notepad save error:", error);
    return NextResponse.json(
      { error: "Failed to save notepad" },
      { status: 500 }
    );
  }
}
