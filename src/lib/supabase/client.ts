"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton browser client. Safe to call from any Client Component.
let client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowser() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
