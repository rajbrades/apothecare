"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FlaskConical, Calendar, User, FileText, Trash2, Loader2,
  Droplets, Bug, TestTubes, Pill, Wheat, Dna, Biohazard, Leaf,
  Archive, ArchiveRestore,
  type LucideIcon,
} from "lucide-react";
import { LabStatusBadge } from "./lab-status-badge";
import { AssignPatientButton } from "./assign-patient-button";
import type { LabReportStatus, LabVendor, LabTestType } from "@/types/database";

const TEST_TYPE_VISUALS: Record<string, { icon: LucideIcon; bg: string; border: string; text: string }> = {
  blood_panel:     { icon: Droplets,      bg: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-600" },
  stool_analysis:  { icon: Bug,           bg: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-600" },
  saliva_hormone:  { icon: FlaskConical,  bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-600" },
  urine_hormone:   { icon: FlaskConical,  bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-600" },
  organic_acids:   { icon: TestTubes,     bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-600" },
  micronutrient:   { icon: Pill,          bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-600" },
  food_sensitivity:{ icon: Wheat,         bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-600" },
  genetic:         { icon: Dna,           bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-600" },
  mycotoxin:       { icon: Biohazard,     bg: "bg-red-50",     border: "border-red-200",    text: "text-red-600" },
  environmental:   { icon: Leaf,          bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-600" },
  other:           { icon: FileText,      bg: "bg-gray-50",    border: "border-gray-200",   text: "text-gray-500" },
};

const DEFAULT_VISUAL = TEST_TYPE_VISUALS.other;

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
    is_archived?: boolean;
    created_at: string;
    patients?: { id?: string; first_name: string | null; last_name: string | null } | null;
  };
  onDelete?: (id: string) => void;
  onArchive?: (id: string, archived: boolean) => void;
  onAssign?: (id: string, patient: { id: string; first_name: string | null; last_name: string | null } | null) => void;
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

export function LabReportCard({ report, onDelete, onArchive, onAssign }: LabReportCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const isArchived = report.is_archived ?? false;
  const patientName = report.patients
    ? [report.patients.first_name, report.patients.last_name].filter(Boolean).join(" ")
    : null;

  const displayName = report.test_name || TEST_TYPE_LABELS[report.test_type] || "Lab Report";
  const vendorLabel = VENDOR_LABELS[report.lab_vendor] || report.lab_vendor;
  const visual = TEST_TYPE_VISUALS[report.test_type] || DEFAULT_VISUAL;
  const IconComponent = visual.icon;

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

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArchiving(true);
    try {
      const res = await fetch(`/api/labs/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: !isArchived }),
      });
      if (res.ok) {
        onArchive?.(report.id, !isArchived);
      }
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className={`group relative flex items-start gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all ${isArchived ? "opacity-50" : ""}`}>
      <Link
        href={`/labs/${report.id}`}
        className="flex items-start gap-4 flex-1 min-w-0"
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${visual.bg} border ${visual.border}`}>
          <IconComponent className={`w-5 h-5 ${visual.text}`} strokeWidth={1.5} />
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
            {!report.collection_date && report.created_at && (
              <span className="inline-flex items-center gap-1" title="Uploaded date (no collection date)">
                <Calendar className="w-3 h-3" />
                Uploaded {formatDate(report.created_at)}
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

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {onAssign && (
          <AssignPatientButton
            labId={report.id}
            currentPatient={report.patients?.id ? { id: report.patients.id, first_name: report.patients.first_name, last_name: report.patients.last_name } : null}
            onAssigned={(p) => onAssign(report.id, p)}
            variant="icon"
          />
        )}
        {onArchive && (
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors disabled:opacity-50"
            title={isArchived ? "Unarchive lab report" : "Archive lab report"}
          >
            {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete lab report"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
