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
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--color-surface)]">
        {children}
      </body>
    </html>
  );
}
