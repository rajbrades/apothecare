"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Trash2, RefreshCcw, ExternalLink, Loader2, FlaskConical } from "lucide-react";
import { ExtractionStatusBadge } from "./extraction-status-badge";
import type { LabReportItem } from "./patient-profile";

interface DocumentItem {
  id: string;
  file_name: string;
  file_size: number;
  document_type: string;
  title: string | null;
  status: string;
  error_message: string | null;
  uploaded_at: string;
  extracted_at: string | null;
}

interface DocumentListProps {
  patientId: string;
  documents: DocumentItem[];
  labReports?: LabReportItem[];
  onDeleted: (docId: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDocType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const LAB_STATUS_MAP: Record<string, string> = {
  uploading: "uploading",
  parsing: "extracting",
  complete: "extracted",
  error: "error",
};

function formatLabVendor(vendor: string): string {
  const labels: Record<string, string> = {
    quest: "Quest",
    labcorp: "LabCorp",
    boston_heart: "Boston Heart",
    vibrant: "Vibrant",
    dutch: "DUTCH",
    doctors_data: "Doctor's Data",
    genova: "Genova",
    other: "Other Lab",
  };
  return labels[vendor] || vendor.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTestType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DocumentList({ patientId, documents, labReports = [], onDeleted }: DocumentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reextracting, setReextracting] = useState<string | null>(null);
  const [docStatuses, setDocStatuses] = useState<Record<string, string>>({});

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeleting(docId);
    try {
      await fetch(`/api/patients/${patientId}/documents/${docId}`, { method: "DELETE" });
      onDeleted(docId);
    } finally {
      setDeleting(null);
    }
  };

  const handleReextract = async (docId: string) => {
    setReextracting(docId);
    setDocStatuses((prev) => ({ ...prev, [docId]: "extracting" }));
    try {
      await fetch(`/api/patients/${patientId}/documents/${docId}/extract`, { method: "POST" });
      // Start polling
      pollStatus(docId);
    } finally {
      setReextracting(null);
    }
  };

  const pollStatus = async (docId: string) => {
    const poll = async () => {
      const res = await fetch(`/api/patients/${patientId}/documents/${docId}`);
      if (!res.ok) return;
      const { document } = await res.json();
      setDocStatuses((prev) => ({ ...prev, [docId]: document.status }));
      if (document.status === "extracting" || document.status === "uploading") {
        setTimeout(poll, 3000);
      }
    };
    setTimeout(poll, 3000);
  };

  const handleViewPdf = async (docId: string) => {
    const res = await fetch(`/api/patients/${patientId}/documents/${docId}`);
    if (!res.ok) return;
    const { signedUrl } = await res.json();
    if (signedUrl) window.open(signedUrl, "_blank");
  };

  if (documents.length === 0 && labReports.length === 0) {
    return (
      <p className="text-center text-sm text-[var(--color-text-muted)] py-6">
        No documents uploaded yet
      </p>
    );
  }

  // Build unified list: documents + lab reports, sorted by date descending
  type UnifiedItem =
    | { kind: "document"; data: DocumentItem }
    | { kind: "lab"; data: LabReportItem };

  const unified: UnifiedItem[] = [
    ...documents.map((d): UnifiedItem => ({ kind: "document", data: d })),
    ...labReports.map((l): UnifiedItem => ({ kind: "lab", data: l })),
  ].sort((a, b) => {
    const dateA = a.kind === "document" ? a.data.uploaded_at : a.data.created_at;
    const dateB = b.kind === "document" ? b.data.uploaded_at : b.data.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="space-y-2">
      {unified.map((item) => {
        if (item.kind === "lab") {
          const lab = item.data;
          const mappedStatus = LAB_STATUS_MAP[lab.status] || lab.status;

          return (
            <div
              key={`lab-${lab.id}`}
              className="flex items-center justify-between p-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {lab.test_name || lab.raw_file_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
                    <span>{formatLabVendor(lab.lab_vendor)}</span>
                    <span>&middot;</span>
                    <span>{formatTestType(lab.test_type)}</span>
                    <span>&middot;</span>
                    <span>{formatFileSize(lab.raw_file_size)}</span>
                    <span>&middot;</span>
                    <span>{new Date(lab.created_at).toLocaleDateString()}</span>
                    <ExtractionStatusBadge status={mappedStatus} />
                  </div>
                  {lab.error_message && lab.status === "error" && (
                    <p className="text-xs text-red-600 mt-0.5 truncate">{lab.error_message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-3">
                <Link
                  href={`/labs/${lab.id}`}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  title="View lab results"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        }

        // Regular document
        const doc = item.data;
        const currentStatus = docStatuses[doc.id] || doc.status;

        return (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-[var(--color-text-muted)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {doc.title || doc.file_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
                  <span className="capitalize">{formatDocType(doc.document_type)}</span>
                  <span>&middot;</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>&middot;</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  <ExtractionStatusBadge status={currentStatus} />
                </div>
                {doc.error_message && currentStatus === "error" && (
                  <p className="text-xs text-red-600 mt-0.5 truncate">{doc.error_message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-3">
              <button
                onClick={() => handleViewPdf(doc.id)}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                title="View PDF"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              {(currentStatus === "error" || currentStatus === "extracted") && (
                <button
                  onClick={() => handleReextract(doc.id)}
                  disabled={reextracting === doc.id}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors disabled:opacity-50"
                  title="Re-extract"
                >
                  {reextracting === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deleting === doc.id}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deleting === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
