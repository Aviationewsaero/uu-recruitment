import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uttaranchal Aviation Recruitment 2026",
  description:
    "Official campus recruitment portal for aviation industry roles at Uttaranchal University. Powered by Elite World Services.",
  robots: { index: false, follow: false }, // private portal — keep out of search
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EWS Aviation",
  },
  formatDetection: { telephone: false, email: false, address: false },
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
