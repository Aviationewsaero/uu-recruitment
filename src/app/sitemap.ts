// Auto-generates /sitemap.xml so Google can discover the public surfaces.
// Add new public routes here as Phase 2/3 ship.

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://careers.ews.aero";
  const now = new Date();
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // NOTE: /register is intentionally NOT listed — the campus drive is closed
    // (see src/lib/drive-gate.ts). When reopening, re-add it here so Google
    // can discover the live registration form again.
  ];
}
