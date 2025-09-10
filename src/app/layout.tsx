// src/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Purchase Tracker',
  description: 'Track purchases, shipments, refunds, and claims.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background-dark text-text-light antialiased">
        {children}

        {/* Floating Settings – visible on ALL pages */}
        <Link
          href="/settings"
          aria-label="Open Settings"
          className="
            fixed bottom-5 right-5 z-[9999]
            rounded-2xl p-3 border border-white/10 bg-surface-dark/90
            shadow-lg backdrop-blur
            transition-transform duration-150
            hover:-translate-y-0.5 group
          "
        >
          {/* subtle glow on hover */}
          <span
            className="
              absolute inset-0 rounded-2xl
              opacity-0 group-hover:opacity-100
              blur-md transition-opacity pointer-events-none
              bg-cyan-500/15
            "
          />
          {/* inline gear icon (no dependency) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="relative h-6 w-6 text-white/85 group-hover:text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.55-.894 3.31.866 2.416 2.416a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.894 1.55-.866 3.31-2.416 2.416a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.55.894-3.31-.866-2.416-2.416a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35A1.724 1.724 0 0 0 5.336 7.8c-.894-1.55.866-3.31 2.416-2.416.97.56 2.2.178 2.573-1.066z"
            />
            <circle cx="12" cy="12" r="3.25" />
          </svg>
        </Link>
      </body>
    </html>
  );
}
