import React from "react";

export const metadata = {
  title: "Intern Portal - Elite World Services",
  description: "Elite World Services Ltd Internship Portal",
};

export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      {children}
    </div>
  );
}
