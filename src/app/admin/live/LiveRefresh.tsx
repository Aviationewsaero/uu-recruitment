"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Triggers a server data refresh every 10 seconds without touching the
// scroll position - the whole RSC tree re-fetches but the URL stays the
// same. Useful for drive-day monitoring without the operator having to
// hit refresh.

const INTERVAL_MS = 10_000;

export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
