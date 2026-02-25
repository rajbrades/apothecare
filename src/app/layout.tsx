import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const siteTitle = "Apothecare — AI Clinical Decision Support for Functional Medicine";
const siteDescription =
  "Evidence-based clinical decision support powered by AI. Built for MDs, DOs, NPs, PAs, DCs, and NDs practicing functional and integrative medicine.";

export const metadata: Metadata = {
  metadataBase: new URL("https://apothecare.ai"),
  title: {
    default: siteTitle,
    template: "%s | Apothecare",
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
    siteName: "Apothecare",
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
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="min-h-screen bg-[var(--color-surface)]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
