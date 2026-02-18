"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} size="sm" className="gap-2">
            <RotateCcw className="icon-inline" />
            Try again
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/dashboard">
              <Home className="icon-inline" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
