"use client";

import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface FullscriptStubButtonProps {
  supplementName: string;
}

export function FullscriptStubButton({ supplementName }: FullscriptStubButtonProps) {
  return (
    <button
      onClick={() =>
        toast.info(`Fullscript integration coming soon — ${supplementName}`)
      }
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-secondary)] transition-colors"
    >
      <ExternalLink size={12} />
      Send to Fullscript
    </button>
  );
}
