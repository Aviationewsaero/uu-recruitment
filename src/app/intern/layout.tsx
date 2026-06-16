import React from "react";

export const metadata = {
  title: "Intern Portal - UU Aviation",
  description: "Uttaranchal University Aviation Internship Portal",
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
