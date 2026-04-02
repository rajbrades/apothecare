"use client";

import { Loader2, CheckCircle, AlertCircle, Clock, Upload } from "lucide-react";

interface ExtractionStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Loader2; color: string }> = {
  uploading: { label: "Uploading", icon: Upload, color: "text-blue-600" },
  uploaded: { label: "Queued", icon: Clock, color: "text-[var(--color-gold-600)]" },
  extracting: { label: "Extracting", icon: Loader2, color: "text-[var(--color-brand-600)]" },
  extracted: { label: "Extracted", icon: CheckCircle, color: "text-[var(--color-brand-600)]" },
  error: { label: "Error", icon: AlertCircle, color: "text-[var(--color-destructive-500)]" },
};

export function ExtractionStatusBadge({ status }: ExtractionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.uploaded;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${config.color}`}>
      <Icon className={`w-3 h-3 ${status === "extracting" ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}
