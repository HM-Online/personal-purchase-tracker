// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ToasterClient from "@/components/ToasterClient";

export const metadata: Metadata = {
  title: "Personal Purchase Tracker",
  description: "Track your online purchases, refunds, and claims.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background-dark text-text-light min-h-screen">
        {children}
        {/* Global toast portal */}
        <ToasterClient />
      </body>
    </html>
  );
}
