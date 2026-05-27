// Local-disk storage for dev. Writes to ./uploads/<bucket>/<path>.
// Files are served via the /api/files/[bucket]/[...path] route.
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "uploads");

export async function uploadFile(
  bucket: string,
  key: string,
  file: { buffer: Buffer; mimeType: string }
) {
  try {
    const full = path.join(ROOT, bucket, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, file.buffer);
    return { ok: true as const, path: key };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Upload failed",
    };
  }
}

export async function getFileUrl(bucket: string, key: string) {
  return `/api/files/${bucket}/${key}`;
}
