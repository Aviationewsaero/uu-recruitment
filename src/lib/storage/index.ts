// Storage abstraction — local disk (dev) vs Supabase Storage (prod).
import { env } from "@/lib/env";
import * as local from "./local";
import * as supabase from "./supabase";

const provider = env.STORAGE_MODE === "supabase" ? supabase : local;

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

/**
 * Upload a file under `bucket/path`. Returns the stored path.
 * `path` should be a relative key like "resumes/UU-AV-2026-0001.pdf"
 */
export const uploadFile = (
  bucket: string,
  path: string,
  file: { buffer: Buffer; mimeType: string }
): Promise<UploadResult> => provider.uploadFile(bucket, path, file);

/** Returns a URL the browser can fetch — signed in supabase mode, local route in dev. */
export const getFileUrl = (bucket: string, path: string): Promise<string> =>
  provider.getFileUrl(bucket, path);

// Validation constants — applied in server actions before calling upload.
export const UPLOAD_LIMITS = {
  resume: {
    maxBytes: 5 * 1024 * 1024, // 5MB
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  photo: {
    maxBytes: 2 * 1024 * 1024, // 2MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
} as const;
