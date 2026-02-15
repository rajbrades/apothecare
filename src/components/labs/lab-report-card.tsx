"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, Calendar, User, FileText, Trash2, Loader2 } from "lucide-react";
import { LabStatusBadge } from "./lab-status-badge";
import type { LabReportStatus, LabVendor, LabTestType } from "@/types/database";

interface LabReportCardProps {
  report: {
    id: string;
    test_name: string | null;
    lab_vendor: LabVendor;
    test_type: LabTestType;
    collection_date: string | null;
    status: LabReportStatus;
    raw_file_name: string | null;
    raw_file_size: number | null;
    created_at: string;
    patients?: { first_name: string | null; last_name: string | null } | null;
  };
  onDelete?: (id: string) => void;
}

const VENDOR_LABELS: Partial<Record<LabVendor, string>> = {
  quest: "Quest Diagnostics",
  labcorp: "LabCorp",
  diagnostic_solutions: "Diagnostic Solutions",
  genova: "Genova Diagnostics",
  precision_analytical: "Precision Analytical",
  mosaic: "Mosaic Diagnostics",
  vibrant: "Vibrant Wellness",
  spectracell: "SpectraCell",
  realtime_labs: "RealTime Labs",
  zrt: "ZRT Laboratory",
  other: "Other Lab",
};

const TEST_TYPE_LABELS: Partial<Record<LabTestType, string>> = {
  blood_panel: "Blood Panel",
  stool_analysis: "Stool Analysis",
  saliva_hormone: "Saliva Hormone",
  urine_hormone: "Urine Hormone",
  organic_acids: "Organic Acids",
  micronutrient: "Micronutrient",
  genetic: "Genetic",
  food_sensitivity: "Food Sensitivity",
  mycotoxin: "Mycotoxin",
  environmental: "Environmental",
  other: "Other",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LabReportCard({ report, onDelete }: LabReportCardProps) {
  const [deleting, setDeleting] = useState(false);
  const patientName = report.patients
    ? [report.patients.first_name, report.patients.last_name].filter(Boolean).join(" ")
    : null;

  const displayName = report.test_name || TEST_TYPE_LABELS[report.test_type] || "Lab Report";
  const vendorLabel = VENDOR_LABELS[report.lab_vendor] || report.lab_vendor;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this lab report and all its biomarker results? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/labs/${report.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(report.id);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative flex items-start gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all">
      <Link
        href={`/labs/${report.id}`}
        className="flex items-start gap-4 flex-1 min-w-0"
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--color-brand-50)] border border-[var(--color-brand-100)]">
          <FlaskConical className="w-5 h-5 text-[var(--color-brand-600)]" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {displayName}
            </h3>
            <LabStatusBadge status={report.status} />
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span>{vendorLabel}</span>
            {report.collection_date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(report.collection_date)}
              </span>
            )}
            {patientName && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {patientName}
              </span>
            )}
            {report.raw_file_name && report.raw_file_size && (
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {formatFileSize(report.raw_file_size)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 p-1.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Delete lab report"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
