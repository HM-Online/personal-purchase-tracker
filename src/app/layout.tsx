import type { Metadata } from "next";
// 1. We import 'Poppins' instead of 'Inter'
import { Poppins } from "next/font/google";
import "./globals.css";

// 2. We configure the font with the styles we want to use
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"], // We'll only load regular and bold weights
});

export const metadata: Metadata = {
  title: "Personal Purchase Tracker",
  description: "A personal app to track all your online purchases.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. We apply the font's class name to the whole app */}
      <body className={poppins.className}>{children}</body>
    </html>
  );
}