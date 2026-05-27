// Supabase Storage provider — prod mode.
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function uploadFile(
  bucket: string,
  key: string,
  file: { buffer: Buffer; mimeType: string }
) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, file.buffer, { contentType: file.mimeType, upsert: false });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, path: key };
}

export async function getFileUrl(bucket: string, key: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, 60 * 60); // 1-hour signed URL
  return data?.signedUrl ?? "";
}
