"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Trash2, ExternalLink, Eye, Loader2, FlaskConical, Pencil, Check, X, ChevronDown, Clock } from "lucide-react";
import { toast } from "sonner";
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
  onRenamed?: (docId: string, newTitle: string) => void;
  onTypeChanged?: (docId: string, newType: string) => void;
  onParseAsLab?: (docId: string) => void;
  onLabDeleted?: (labId: string) => void;
  onLabClick?: (labId: string) => void;
  onDocClick?: (docId: string) => void;
  groupBy?: boolean;
}

const DOCUMENT_TYPES = [
  { value: "intake_form", label: "Intake Form" },
  { value: "health_history", label: "Health History" },
  { value: "lab_report", label: "Lab Report" },
  { value: "outside_encounter_note", label: "Outside Encounter Note" },
  { value: "imaging", label: "Imaging" },
  { value: "referral", label: "Referral" },
  { value: "consent", label: "Consent" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

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

const CATEGORY_ORDER = [
  "Lab Reports",
  "Clinical Records",
  "Imaging",
  "Referrals",
  "Administrative",
  "Other",
] as const;

type UnifiedItem =
  | { kind: "document"; data: DocumentItem }
  | { kind: "lab"; data: LabReportItem };

function getDocumentCategory(item: UnifiedItem): string {
  if (item.kind === "lab") return "Lab Reports";
  const t = item.data.document_type;
  if (t === "lab_report") return "Lab Reports";
  if (t === "intake_form" || t === "health_history") return "Clinical Records";
  if (t === "imaging") return "Imaging";
  if (t === "referral") return "Referrals";
  if (t === "consent" || t === "insurance") return "Administrative";
  return "Other";
}

function buildUnified(documents: DocumentItem[], labReports: LabReportItem[]): UnifiedItem[] {
  return [
    ...documents.map((d): UnifiedItem => ({ kind: "document", data: d })),
    ...labReports.map((l): UnifiedItem => ({ kind: "lab", data: l })),
  ].sort((a, b) => {
    const dateA = a.kind === "document" ? a.data.uploaded_at : a.data.created_at;
    const dateB = b.kind === "document" ? b.data.uploaded_at : b.data.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

export function DocumentList({ patientId, documents, labReports = [], onDeleted, onRenamed, onTypeChanged, onParseAsLab, onLabDeleted, onLabClick, onDocClick, groupBy = false }: DocumentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [changingTypeId, setChangingTypeId] = useState<string | null>(null);
  const [typeSaving, setTypeSaving] = useState(false);

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

  const startRename = (doc: DocumentItem) => {
    setRenamingId(doc.id);
    setRenameValue(doc.title || doc.file_name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const saveLabRename = async (labId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setRenameSaving(true);
    try {
      const res = await fetch(`/api/labs/${labId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Rename failed");
      }
      toast.success("Lab report renamed");
      setRenamingId(null);
      setRenameValue("");
      // Trigger parent refresh
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setRenameSaving(false);
    }
  };

  const saveRename = async (docId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setRenameSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Rename failed");
      }
      onRenamed?.(docId, trimmed);
      toast.success("Document renamed");
      setRenamingId(null);
      setRenameValue("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setRenameSaving(false);
    }
  };

  const saveType = async (docId: string, newType: string) => {
    setTypeSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: newType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Type change failed");
      }
      onTypeChanged?.(docId, newType);
      toast.success("Document type updated");
      setChangingTypeId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Type change failed");
    } finally {
      setTypeSaving(false);
    }
  };

  const handleDeleteLab = async (labId: string) => {
    if (!confirm("Delete this lab report and all its biomarker results? This cannot be undone.")) return;
    setDeleting(labId);
    try {
      const res = await fetch(`/api/labs/${labId}`, { method: "DELETE" });
      if (res.ok) {
        onLabDeleted?.(labId);
        toast.success("Lab report deleted");
      }
    } finally {
      setDeleting(null);
    }
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

  const unified = buildUnified(documents, labReports);

  const PROCESSING_STATUSES = new Set(["uploading", "uploaded", "extracting", "queued", "parsing"]);
  const processingCount =
    documents.filter((d) => PROCESSING_STATUSES.has(d.status)).length +
    labReports.filter((l) => PROCESSING_STATUSES.has(l.status)).length;

  const processingBanner = processingCount > 0 ? (
    <div className="flex items-center gap-2.5 px-4 py-3 text-sm bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-[var(--radius-md)] text-[var(--color-brand-700)]">
      <Clock className="w-4 h-4 shrink-0 animate-pulse" />
      <span>
        {processingCount === 1 ? "1 document is" : `${processingCount} documents are`} being processed.
        You can leave this page and check back in a few minutes.
      </span>
    </div>
  ) : null;

  const renderItem = (item: UnifiedItem) => {
        if (item.kind === "lab") {
          const lab = item.data;
          const mappedStatus = LAB_STATUS_MAP[lab.status] || lab.status;

          return (
            <div
              key={`lab-${lab.id}`}
              className={`flex items-center justify-between p-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)] transition-colors ${onLabClick ? "cursor-pointer hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-brand-200)]" : ""}`}
              onClick={() => onLabClick?.(lab.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  {renamingId === `lab-${lab.id}` ? (
                    <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); saveLabRename(lab.id); }}>
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Escape") cancelRename(); }}
                        className="text-sm font-medium px-2 py-1 border border-[var(--color-brand-300)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-500)] w-full max-w-[300px]"
                        disabled={renameSaving}
                      />
                      <button type="submit" className="p-1 text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]" disabled={renameSaving || !renameValue.trim()}>
                        {renameSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={cancelRename} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]" disabled={renameSaving}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {lab.test_name || lab.raw_file_name}
                  </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
                    <span>{formatLabVendor(lab.lab_vendor)}</span>
                    <span>&middot;</span>
                    <span>{formatTestType(lab.test_type)}</span>
                    <span>&middot;</span>
                    {lab.raw_file_size != null && <span>{formatFileSize(lab.raw_file_size)}</span>}
                    <span>&middot;</span>
                    <span>{new Date(lab.created_at).toLocaleDateString()}</span>
                    <ExtractionStatusBadge status={mappedStatus} />
                  </div>
                  {lab.error_message && lab.status === "error" && (
                    <p className="text-xs text-red-600 mt-0.5 truncate">{lab.error_message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                {onLabClick ? (
                  <button
                    onClick={() => onLabClick(lab.id)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
                    title="Preview lab results"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    href={`/labs/${lab.id}`}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                    title="View lab results"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  onClick={() => { setRenamingId(`lab-${lab.id}`); setRenameValue(lab.test_name || lab.raw_file_name || ""); }}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
                  title="Rename"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteLab(lab.id)}
                  disabled={deleting === lab.id}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete lab report"
                >
                  {deleting === lab.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        }

        // Regular document
        const doc = item.data;

        return (
          <div
            key={doc.id}
            className={`flex items-center justify-between p-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)] transition-colors ${onDocClick ? "cursor-pointer hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-brand-200)]" : ""}`}
            onClick={() => onDocClick?.(doc.id)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-[var(--color-text-muted)]" />
              </div>
              <div className="min-w-0">
                {renamingId === doc.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); saveRename(doc.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelRename(); }}
                      className="flex-1 px-2 py-0.5 text-sm font-medium rounded border border-[var(--color-brand-300)] bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
                      disabled={renameSaving}
                    />
                    <button
                      type="submit"
                      disabled={renameSaving || !renameValue.trim()}
                      className="p-1 text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] disabled:opacity-50"
                      title="Save"
                    >
                      {renameSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      disabled={renameSaving}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] disabled:opacity-50"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {doc.title || (() => { try { return decodeURIComponent(doc.file_name).replace(/\.pdf$/i, ""); } catch { return doc.file_name; } })()}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-0.5" onClick={(e) => e.stopPropagation()}>
                  {changingTypeId === doc.id ? (
                    <select
                      autoFocus
                      value={doc.document_type}
                      onChange={(e) => saveType(doc.id, e.target.value)}
                      onBlur={() => { if (!typeSaving) setChangingTypeId(null); }}
                      disabled={typeSaving}
                      className="px-1.5 py-0.5 text-xs rounded border border-[var(--color-brand-300)] bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setChangingTypeId(doc.id)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded border border-dashed border-transparent hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)] transition-all cursor-pointer group"
                      title="Click to change document type"
                    >
                      <span className="capitalize">{formatDocType(doc.document_type)}</span>
                      <ChevronDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                  <span>&middot;</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>&middot;</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  <ExtractionStatusBadge status={doc.status} />
                </div>
                {doc.error_message && doc.status === "error" && (
                  <p className="text-xs text-red-600 mt-0.5 truncate">{doc.error_message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
              {onDocClick ? (
                <button
                  onClick={() => onDocClick(doc.id)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
                  title="Preview document"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleViewPdf(doc.id)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  title="View PDF"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => startRename(doc)}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
                title="Rename"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {doc.document_type === "lab_report" && onParseAsLab && (
                <button
                  onClick={() => onParseAsLab(doc.id)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-emerald-600 transition-colors"
                  title="Parse biomarkers"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
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
  };

  if (groupBy) {
    const groups = new Map<string, UnifiedItem[]>();
    for (const item of unified) {
      const cat = getDocumentCategory(item);
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }

    return (
      <div className="space-y-6">
        {processingBanner}
        {CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((cat) => {
          const items = groups.get(cat)!;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  {cat}
                </h3>
                <span className="text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] px-1.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map(renderItem)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {processingBanner}
      {unified.map(renderItem)}
    </div>
  );
}
