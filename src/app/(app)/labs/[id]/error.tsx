"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LabError({
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
          Failed to load lab report
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          {error.message || "This lab report could not be loaded. It may have been deleted or you may not have access."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} size="sm" className="gap-2">
            <RotateCcw className="icon-inline" />
            Try again
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/labs">
              <ArrowLeft className="icon-inline" />
              Back to Labs
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
