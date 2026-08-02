// Next.js generates /robots.txt from this file at build time.
// Allows search engines to index the public careers landing and
// drive listings, but explicitly blocks every private route.

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/",
          "/recruiter",
          "/recruiter/",
          // Drive closed — keep the whole registration path out of the index
          // (see src/lib/drive-gate.ts). On reopen, drop these two lines and
          // keep only "/register/success" disallowed.
          "/register",
          "/register/",
          "/api/",
          "/display",
        ],
      },
    ],
    sitemap: "https://careers.ews.aero/sitemap.xml",
    host: "https://careers.ews.aero",
  };
}
