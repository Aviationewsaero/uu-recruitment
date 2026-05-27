import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uttaranchal Aviation Recruitment 2026",
  description:
    "Official campus recruitment portal for aviation industry roles at Uttaranchal University. Powered by Elite World Services.",
  robots: { index: false, follow: false }, // private portal — keep out of search
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
