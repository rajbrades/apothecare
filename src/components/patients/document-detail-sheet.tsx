"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X, ExternalLink, Loader2, FileText, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface DocumentData {
  id: string;
  patient_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: string;
  document_date: string | null;
  title: string | null;
  status: string;
  extracted_text: string | null;
  extracted_data: Record<string, unknown> | null;
  extraction_summary: string | null;
  error_message: string | null;
  uploaded_at: string;
  extracted_at: string | null;
}

interface DocumentDetailSheetProps {
  documentId: string | null;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onRetried?: () => void;
}

function formatDocType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PROCESSING_STATUSES = new Set(["uploading", "uploaded", "extracting"]);

/** Render extracted data values in a human-readable way instead of raw JSON */
function renderExtractedValue(key: string, value: unknown): ReactNode {
  if (value == null || value === "") return <span className="text-[var(--color-text-muted)] italic">—</span>;

  // Simple string/number
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <span>{String(value)}</span>;
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-[var(--color-text-muted)] italic">None</span>;

    // Array of objects (surgeries, hospitalizations)
    if (typeof value[0] === "object" && value[0] !== null && !Array.isArray(value[0])) {
      return (
        <ul className="space-y-1 mt-0.5">
          {value.map((item, i) => {
            const obj = item as Record<string, unknown>;
            const parts = Object.values(obj).filter(Boolean).map(String);
            return <li key={i} className="flex items-start gap-1.5"><span className="text-[var(--color-text-muted)]">•</span>{parts.join(" — ")}</li>;
          })}
        </ul>
      );
    }

    // Array of strings
    return (
      <div className="flex flex-wrap gap-1 mt-0.5">
        {value.map((item, i) => (
          <span key={i} className="inline-block px-2 py-0.5 text-[11px] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-full">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  // Objects (lifestyle, symptom_scores)
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v != null && v !== "");
    if (entries.length === 0) return <span className="text-[var(--color-text-muted)] italic">—</span>;

    // Symptom scores: show as bar chart-like display
    if (key === "symptom_scores") {
      return (
        <div className="space-y-1 mt-1">
          {entries.map(([k, v]) => {
            const score = Number(v) || 0;
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="w-24 truncate capitalize text-[11px] text-[var(--color-text-muted)]">{k.replace(/_/g, " ")}</span>
                <div className="flex-1 h-2 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${score * 10}%`,
                      backgroundColor: score >= 7 ? "var(--color-biomarker-out-of-range)" : score >= 4 ? "var(--color-biomarker-borderline)" : "var(--color-biomarker-optimal)",
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono w-4 text-right">{score}</span>
              </div>
            );
          })}
        </div>
      );
    }

    // Generic object: key-value list
    return (
      <div className="space-y-0.5 mt-0.5">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-2">
            <span className="text-[11px] text-[var(--color-text-muted)] capitalize w-28 flex-shrink-0">{k.replace(/_/g, " ")}</span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">
              {Array.isArray(v) ? v.join(", ") : String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

export function DocumentDetailSheet({ documentId, patientId, patientName, onClose, onRetried }: DocumentDetailSheetProps) {
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Fetch document data when documentId changes
  useEffect(() => {
    if (!documentId) { setDoc(null); setSignedUrl(null); return; }
    setLoading(true);
    fetch(`/api/patients/${patientId}/documents/${documentId}`)
      .then((r) => r.json())
      .then((data) => {
        setDoc(data.document);
        setSignedUrl(data.signedUrl || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [documentId, patientId]);

  // Escape key to close
  useEffect(() => {
    if (!documentId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [documentId, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!documentId) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [documentId]);

  const handleRetry = async () => {
    if (!doc) return;
    setRetrying(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/documents/${doc.id}/retry`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Retry failed");
      }
      toast.success("Re-extraction started — check back in a minute");
      setDoc((prev) => prev ? { ...prev, status: "extracting", error_message: null } : prev);
      onRetried?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  if (!documentId) return null;

  const displayName = doc?.title || doc?.file_name || "Document";
  const isProcessing = doc ? PROCESSING_STATUSES.has(doc.status) : false;
  const isExtracted = doc?.status === "extracted";
  const isError = doc?.status === "error";

  // Parse extracted_data for display
  const extractedEntries = doc?.extracted_data
    ? Object.entries(doc.extracted_data).filter(([, v]) => v != null && v !== "")
    : [];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full sm:w-[500px] sm:max-w-[90vw] bg-[var(--color-surface)] flex flex-col h-full overflow-hidden border-l border-[var(--color-border-light)]">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--color-border-light)] shrink-0 gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              {patientName} &middot; {doc ? formatDocType(doc.document_type) : "Document"}
            </p>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2">
              {loading ? "Loading…" : displayName}
            </h2>
            {doc && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {formatFileSize(doc.file_size)}
                {doc.document_date && ` · ${formatDate(doc.document_date)}`}
                {!doc.document_date && ` · Uploaded ${formatDate(doc.uploaded_at)}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)] rounded-[var(--radius-md)] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View PDF
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
            </div>
          ) : !doc ? (
            <p className="text-center text-sm text-[var(--color-text-muted)] py-12">
              Failed to load document.
            </p>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center px-8">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-600)]" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Processing document…</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Extracted content will appear once processing is complete.
                You can close this and check back in a few minutes.
              </p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-5">

              {/* Error state */}
              {isError && (
                <div className="p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-red-700">Extraction failed</p>
                      {doc.error_message && (
                        <p className="text-xs text-red-600 mt-0.5 break-words">{doc.error_message}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-[var(--radius-md)] hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {retrying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Retry extraction
                  </button>
                </div>
              )}

              {/* Extraction summary */}
              {doc.extraction_summary && (
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                    Summary
                  </h3>
                  <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {doc.extraction_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Extracted structured data */}
              {extractedEntries.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                    Extracted Data
                  </h3>
                  <div className="space-y-1">
                    {extractedEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="py-1.5 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                      >
                        <span className="text-xs font-medium text-[var(--color-text-muted)] capitalize block mb-0.5">
                          {key.replace(/_/g, " ")}
                        </span>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {renderExtractedValue(key, value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted text */}
              {doc.extracted_text && (
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                    Full Extracted Text
                  </h3>
                  <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] max-h-80 overflow-y-auto">
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap font-[var(--font-mono)]">
                      {doc.extracted_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {isExtracted && !doc.extraction_summary && !doc.extracted_text && (
                <p className="text-sm text-center text-[var(--color-text-muted)] py-6">
                  No content was extracted from this document.
                </p>
              )}

              {doc.extracted_at && (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                  <Clock className="w-3 h-3" />
                  Extracted on {formatDate(doc.extracted_at)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {signedUrl && (
          <div className="px-5 py-3 border-t border-[var(--color-border-light)] shrink-0">
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Open PDF in new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
