// Client-side image compression. Resizes large phone photos to a sane
// size before upload. Defensive: NEVER hangs. Every async step has a
// timeout; on failure we return the original file with a flag so the UI
// can warn the student that compression was skipped.

const MAX_DIM = 800;
const TARGET_BYTES = 150 * 1024;
const Q_HIGH = 0.78;
const Q_LOW = 0.6;
// Per-step timeout. AGGRESSIVE - we'd rather upload a bigger original
// than have the student staring at a spinner. Server now accepts 8 MB
// so it's safe to bail compression and pass the original through.
const STEP_TIMEOUT_MS = 5_000;

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

/** Wrap a promise in a timeout - rejects if it takes longer than ms. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function convertHeicToJpegBlob(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });
  return Array.isArray(out) ? out[0] : out;
}

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
  /** True when we couldn't process the photo so the original is being
   *  uploaded as-is. UI surfaces this so the student knows. */
  compressionSkipped: boolean;
  skipReason?: string;
};

function passthrough(file: File, skipReason: string): CompressResult {
  // eslint-disable-next-line no-console
  console.warn("[compressImage] skipping compression:", skipReason, {
    name: file.name,
    type: file.type,
    size: file.size,
  });
  return {
    file,
    beforeBytes: file.size,
    afterBytes: file.size,
    width: 0,
    height: 0,
    convertedFromHeic: false,
    compressionSkipped: true,
    skipReason,
  };
}

/**
 * Compress + (if needed) convert HEIC. NEVER hangs - every step has a
 * timeout. NEVER throws - on any failure returns the original file with
 * compressionSkipped=true.
 */
export async function compressImage(file: File): Promise<CompressResult> {
  // eslint-disable-next-line no-console
  console.log("[compressImage] start", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (!file.type.startsWith("image/") && !isHeic(file)) {
    return passthrough(file, "not an image");
  }

  // 1. HEIC -> JPEG blob (only if needed)
  let source: Blob = file;
  let convertedFromHeic = false;
  if (isHeic(file)) {
    try {
      source = await withTimeout(
        convertHeicToJpegBlob(file),
        STEP_TIMEOUT_MS,
        "HEIC conversion"
      );
      convertedFromHeic = true;
    } catch (e) {
      return passthrough(file, `HEIC decode failed: ${(e as Error).message}`);
    }
  }

  // 2. Decode bitmap (sized for resize)
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await withTimeout(
      createImageBitmap(source),
      STEP_TIMEOUT_MS,
      "Image decode"
    );
  } catch (e) {
    return passthrough(file, `Bitmap decode failed: ${(e as Error).message}`);
  }
  if (!bitmap) return passthrough(file, "Bitmap decode returned null");

  // 3. Compute target dimensions
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > MAX_DIM ? MAX_DIM / longest : 1;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  // 4. Draw to canvas
  let canvas: HTMLCanvasElement;
  try {
    canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return passthrough(file, "Canvas 2d context unavailable");
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();
  } catch (e) {
    return passthrough(file, `Canvas draw failed: ${(e as Error).message}`);
  }

  // 5. Encode JPEG (two-pass quality)
  let blob: Blob | null = null;
  try {
    blob = await withTimeout(
      encodeJpeg(canvas, Q_HIGH),
      STEP_TIMEOUT_MS,
      "JPEG encode"
    );
    if (blob && blob.size > TARGET_BYTES) {
      const retry = await withTimeout(
        encodeJpeg(canvas, Q_LOW),
        STEP_TIMEOUT_MS,
        "JPEG re-encode"
      );
      if (retry && retry.size < blob.size) blob = retry;
    }
  } catch (e) {
    return passthrough(file, `JPEG encode failed: ${(e as Error).message}`);
  }
  if (!blob || blob.size === 0) {
    return passthrough(file, "JPEG encode produced empty blob");
  }

  const newName = file.name.replace(/\.(heic|heif|png|webp)$/i, ".jpg");
  const newFile = new File([blob], newName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });

  // eslint-disable-next-line no-console
  console.log("[compressImage] success", {
    before: file.size,
    after: blob.size,
    width: targetW,
    height: targetH,
    convertedFromHeic,
  });

  return {
    file: newFile,
    beforeBytes: file.size,
    afterBytes: blob.size,
    width: targetW,
    height: targetH,
    convertedFromHeic,
    compressionSkipped: false,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
