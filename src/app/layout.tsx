import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const siteTitle = "Apotheca — AI Clinical Decision Support for Functional Medicine";
const siteDescription =
  "Evidence-based clinical decision support powered by AI. Built for MDs, DOs, NPs, PAs, DCs, and NDs practicing functional and integrative medicine.";

export const metadata: Metadata = {
  metadataBase: new URL("https://apotheca.ai"),
  title: {
    default: siteTitle,
    template: "%s | Apotheca",
  },
  description: siteDescription,
  keywords: [
    "functional medicine",
    "clinical decision support",
    "AI",
    "evidence-based medicine",
    "lab interpretation",
    "IFM",
    "A4M",
  ],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "Apotheca",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700;1,9..40,300..700&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--color-surface)]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
