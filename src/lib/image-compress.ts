// Client-side image compression. Resizes large phone photos to a sane size
// before upload. Runs entirely in the browser via Canvas — no new deps.
//
// Phone cameras produce 4-10 MB JPEGs. Vercel functions struggle to
// receive + upload those in time (~15 sec budget). Compressing to ~500 KB
// before upload makes the round trip 10x faster.

const MAX_DIM = 1280; // longest edge in pixels
const JPEG_QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  // Only compress images. Skip if non-image (shouldn't happen given accept=image/*).
  if (!file.type.startsWith("image/")) return file;
  // Skip if already small enough
  if (file.size <= 500 * 1024) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // browser couldn't decode — let the server reject

  // Compute target dimensions, preserving aspect ratio
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > MAX_DIM ? MAX_DIM / longest : 1;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  // Render to canvas
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  // Encode as JPEG
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  // Wrap back as File so the upload pipeline treats it the same way
  const newName = file.name.replace(/\.(heic|heif|png|webp)$/i, ".jpg");
  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
