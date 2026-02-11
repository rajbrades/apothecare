import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apotheca — AI Clinical Decision Support for Functional Medicine",
  description:
    "Evidence-based clinical decision support powered by AI. Built for MDs, DOs, NPs, PAs, DCs, and NDs practicing functional and integrative medicine.",
  keywords: [
    "functional medicine",
    "clinical decision support",
    "AI",
    "evidence-based medicine",
    "lab interpretation",
    "IFM",
    "A4M",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--color-surface)]">
        {children}
      </body>
    </html>
  );
}
