import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://careers.ews.aero"),
  title: {
    default: "Elite World Services Limited · Aviation Careers",
    template: "%s · EWS Aviation Careers",
  },
  description:
    "Aviation careers across India's airport network. Direct hiring, paid internships, and campus recruitment partnerships with universities and corporates.",
  // Default: PUBLIC pages (landing, drives, jobs) are indexable. Private
  // routes (/admin, /recruiter, /register/success, /api/admit-card) set
  // noindex locally via their own metadata.
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EWS Aviation",
  },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    title: "Elite World Services Limited · Aviation Careers",
    description:
      "Aviation careers across India's airport network. Direct hiring, paid internships, and campus recruitment partnerships.",
    type: "website",
    url: "https://careers.ews.aero",
    siteName: "EWS Aviation Careers",
  },
};

// Mobile: lock zoom, fit notch, theme the address bar.
// Makes the site feel like a native app instead of a webpage.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e3a8a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <div id="main" className="flex flex-col flex-1">
          {children}
        </div>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
