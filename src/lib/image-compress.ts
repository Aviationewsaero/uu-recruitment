// Client-side image compression. Resizes large phone photos to a sane size
// before upload. Runs entirely in the browser via Canvas - no server work.
//
// Goal: get every uploaded photo under ~150 KB while staying recognisable
// as a passport-style headshot. 800px on the longest edge is plenty for
// a 1.5"x2" thumbnail printed on an admit card or shown in the recruiter
// dashboard. Aggressive compression also dodges Vercel function timeout +
// the server's 2 MB cap with huge headroom.

const MAX_DIM = 800; // longest edge in pixels (was 1280)
const TARGET_BYTES = 150 * 1024; // aim for <150 KB
const Q_HIGH = 0.78;
const Q_LOW = 0.6;

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
  // Dynamic import - heic2any is browser-only and ~80 KB gzipped. Only
  // loaded when actually needed (Android users never pay the cost).
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9, // re-compress after the resize below
  });
  return Array.isArray(out) ? out[0] : out;
}

/** Encode the canvas at the given quality, return Blob + bytes. */
function encodeJpeg(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
}

export type CompressResult = {
  file: File;
  beforeBytes: number;
  afterBytes: number;
  width: number;
  height: number;
  convertedFromHeic: boolean;
};

/**
 * Compress + (if needed) convert HEIC to a small JPEG suitable for upload.
 * Returns the new File plus before/after metadata so the UI can show the
 * student "Photo ready - 132 KB" feedback.
 */
export async function compressImage(file: File): Promise<CompressResult> {
  const beforeBytes = file.size;
  // Skip uncommon non-image MIME (shouldn't happen given the accept attr).
  if (!file.type.startsWith("image/") && !isHeic(file)) {
    return {
      file,
      beforeBytes,
      afterBytes: beforeBytes,
      width: 0,
      height: 0,
      convertedFromHeic: false,
    };
  }

  let source: Blob = file;
  let convertedFromHeic = false;
  if (isHeic(file)) {
    try {
      source = await convertHeicToJpegBlob(file);
      convertedFromHeic = true;
    } catch {
      // Conversion failed - return original; server will reject with a
      // clear MIME error.
      return {
        file,
        beforeBytes,
        afterBytes: beforeBytes,
        width: 0,
        height: 0,
        convertedFromHeic: false,
      };
    }
  }

  const bitmap = await createImageBitmap(source).catch(() => null);
  if (!bitmap) {
    return {
      file,
      beforeBytes,
      afterBytes: beforeBytes,
      width: 0,
      height: 0,
      convertedFromHeic,
    };
  }

  // Compute target dimensions, preserving aspect ratio
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > MAX_DIM ? MAX_DIM / longest : 1;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return {
      file,
      beforeBytes,
      afterBytes: beforeBytes,
      width: targetW,
      height: targetH,
      convertedFromHeic,
    };
  }
  // White background in case the source had transparency (PNG) - JPEG
  // doesn't support alpha and would otherwise come out black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  // Two-pass quality: try Q_HIGH first; if still too big, drop to Q_LOW.
  let blob = await encodeJpeg(canvas, Q_HIGH);
  if (blob && blob.size > TARGET_BYTES) {
    const retry = await encodeJpeg(canvas, Q_LOW);
    if (retry && retry.size < blob.size) blob = retry;
  }
  if (!blob) {
    return {
      file,
      beforeBytes,
      afterBytes: beforeBytes,
      width: targetW,
      height: targetH,
      convertedFromHeic,
    };
  }

  const newName = file.name.replace(/\.(heic|heif|png|webp)$/i, ".jpg");
  const newFile = new File([blob], newName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
  return {
    file: newFile,
    beforeBytes,
    afterBytes: blob.size,
    width: targetW,
    height: targetH,
    convertedFromHeic,
  };
}

/** Format bytes as a human-friendly string ("132 KB", "1.4 MB"). */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
