import type { LabReportStatus } from "@/types/database";

const STATUS_CONFIG: Record<LabReportStatus, { label: string; className: string }> = {
  uploading: {
    label: "Uploading",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  classifying: {
    label: "Classifying",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  parsing: {
    label: "Parsing",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  interpreting: {
    label: "Interpreting",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  complete: {
    label: "Complete",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  error: {
    label: "Error",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const PROCESSING_STATUSES: LabReportStatus[] = ["uploading", "classifying", "parsing", "interpreting"];

export function LabStatusBadge({ status }: { status: LabReportStatus }) {
  const config = STATUS_CONFIG[status];
  const isProcessing = PROCESSING_STATUSES.includes(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${config.className}`}
    >
      {isProcessing && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
