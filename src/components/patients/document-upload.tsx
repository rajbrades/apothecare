"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { DocumentType, DocumentStatus } from "@/types/database";

interface DocumentUploadProps {
  patientId: string;
  onUploaded: (doc: {
    id: string;
    file_name: string;
    file_size: number;
    document_type: DocumentType;
    title: string | null;
    status: DocumentStatus;
    error_message: string | null;
    uploaded_at: string;
    extracted_at: string | null;
  }) => void;
}

const DOCUMENT_TYPES = [
  { value: "intake_form", label: "Intake Form" },
  { value: "health_history", label: "Health History" },
  { value: "lab_report", label: "Lab Report" },
  { value: "imaging", label: "Imaging" },
  { value: "referral", label: "Referral" },
  { value: "consent", label: "Consent" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function DocumentUpload({ patientId, onUploaded }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [docType, setDocType] = useState("intake_form");
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", docType);
      if (title.trim()) formData.append("title", title.trim());

      const res = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { document } = await res.json();
      onUploaded(document);
      toast.success("Document uploaded — extraction starting");
      setTitle("");

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Document type + title row */}
      <div className="flex gap-3">
        <div className="w-48">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Initial Intake Questionnaire"
            className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[var(--radius-md)] cursor-pointer transition-colors ${
          dragActive
            ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)]"
            : "border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-surface-secondary)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />

        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-[var(--color-brand-600)] animate-spin mb-2" />
            <p className="text-sm text-[var(--color-text-secondary)]">Uploading...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center mb-3">
              {dragActive ? (
                <FileText className="w-6 h-6 text-[var(--color-brand-600)]" />
              ) : (
                <Upload className="w-6 h-6 text-[var(--color-text-muted)]" />
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
              <span className="font-medium text-[var(--color-brand-600)]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">PDF only, max 10MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
