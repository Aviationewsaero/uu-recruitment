// Client-side image compression. Resizes large phone photos to a sane size
// before upload. Runs entirely in the browser via Canvas — no server work.
//
// Phone cameras produce 4-10 MB JPEGs (or HEIC on iPhone). Vercel functions
// struggle to receive + upload those in time. Compressing to ~500 KB JPEG
// before upload makes the round trip much faster AND survives the server's
// strict 2 MB + jpeg/png/webp validator.

const MAX_DIM = 1280; // longest edge in pixels
const JPEG_QUALITY = 0.82;

// iPhone-camera default format. Most browsers can't decode it natively, so
// we feed it through heic2any first.
const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

function isHeic(file: File): boolean {
  if (HEIC_TYPES.has(file.type.toLowerCase())) return true;
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".heic") || lowerName.endsWith(".heif");
}

async function convertHeicToJpegBlob(file: File): Promise<Blob> {
  // Dynamic import — heic2any is browser-only and 80 KB gzipped. Loading
  // it only when needed keeps the registration page snappy on Android.
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9, // we'll re-compress after the resize
  });
  // heic2any returns Blob | Blob[] depending on whether the HEIC contains
  // multiple frames. We only want the first frame.
  return Array.isArray(out) ? out[0] : out;
}

export async function compressImage(file: File): Promise<File> {
  // Only compress images. Skip if non-image (shouldn't happen given accept=image/*).
  if (!file.type.startsWith("image/") && !isHeic(file)) return file;

  // HEIC must be converted FIRST — Canvas can't decode it.
  let source: Blob = file;
  if (isHeic(file)) {
    try {
      source = await convertHeicToJpegBlob(file);
    } catch {
      // Conversion failed — fall through with the original. The server-side
      // MIME validator will reject it with a clear error, which is better
      // than uploading a 6 MB unreadable blob.
      return file;
    }
  } else if (file.size <= 500 * 1024) {
    // Already small enough — skip the canvas round-trip
    return file;
  }

  const bitmap = await createImageBitmap(source).catch(() => null);
  if (!bitmap) {
    // Browser couldn't decode even after HEIC conversion — let the server
    // reject with a real error message.
    return file;
  }

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
