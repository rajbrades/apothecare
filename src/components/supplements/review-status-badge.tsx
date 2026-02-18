"use client";

interface ReviewStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; pulse?: boolean }
> = {
  complete: {
    label: "Complete",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  generating: {
    label: "Generating",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    pulse: true,
  },
  error: {
    label: "Error",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  pending: {
    label: "Pending",
    className: "bg-gray-50 text-gray-600 border-gray-200",
  },
};

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium border rounded-[var(--radius-sm)] ${config.className} ${
        config.pulse ? "animate-pulse" : ""
      }`}
    >
      {config.label}
    </span>
  );
}
