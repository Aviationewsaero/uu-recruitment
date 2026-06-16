import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveIntern } from "@/lib/auth-intern";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Proxy route: GET /api/intern/slide?materialId=xxx&slideNumber=1
//
// Fetches the slide from Supabase Storage server-side (service role, no CORS)
// and streams it back as a same-origin response. This lets SlideViewer draw
// the image on a <canvas> without the browser blocking cross-origin canvas access.
export async function GET(request: NextRequest) {
  try {
    await requireActiveIntern();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const materialId = searchParams.get("materialId");
  const slideNumber = parseInt(searchParams.get("slideNumber") || "0", 10);

  if (!materialId || !slideNumber) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const slide = await prisma.studyMaterialSlide.findFirst({
    where: { materialId, slideNumber },
  });

  if (!slide) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Short expiry (60 s) — just enough for the proxy fetch
  const { data, error } = await supabase.storage
    .from("study-materials")
    .createSignedUrl(slide.imagePath, 60);

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error);
    return new NextResponse("Storage error", { status: 500 });
  }

  const upstream = await fetch(data.signedUrl);
  if (!upstream.ok) {
    return new NextResponse("Failed to fetch slide", { status: 502 });
  }

  const buffer = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "image/png";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      // Cache privately for 1 h — same intern, same slide, skip re-fetch
      "Cache-Control": "private, max-age=3600, immutable",
    },
  });
}
