import type { NextConfig } from "next";

// Security headers applied to every response by the platform.
// HSTS = force HTTPS for 2 years. X-Frame-Options DENY = no iframing.
// Referrer-Policy = strip URL when navigating off-site.
// Permissions-Policy = browser feature lockdown.
// X-Content-Type-Options nosniff = block MIME-sniffing.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  // Heavy native/CJS deps that shouldn't be bundled by Next — required by
  // Prisma adapter + bcryptjs + pdf renderer for cold-start performance.
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "@react-pdf/renderer",
    "bcryptjs",
  ],

  // Apply security headers to every route.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
