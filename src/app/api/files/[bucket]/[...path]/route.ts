// Local-disk file server for dev mode only.
// In prod, files are served via Supabase Storage signed URLs — this route is unused.
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

type Ctx = { params: Promise<{ bucket: string; path: string[] }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (env.STORAGE_MODE !== "local") {
    return NextResponse.json({ error: "Not available in prod" }, { status: 404 });
  }
  const { bucket, path: parts } = await params;
  const full = path.join(process.cwd(), "uploads", bucket, ...parts);
  try {
    const buf = await fs.readFile(full);
    const ext = path.extname(full).slice(1).toLowerCase();
    const types: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": types[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
