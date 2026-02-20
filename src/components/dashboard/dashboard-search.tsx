"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Microscope, Stethoscope, BookOpen, Search, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SourceFilterPopover } from "@/components/chat/source-filter-popover";
import { ALL_SOURCE_IDS, getSourceLabel, isDefaultSelection, type SourceId } from "@/lib/ai/source-filter";
import type { ChatAttachment } from "@/types/database";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface DashboardSearchProps {
  patients: PatientOption[];
}

export function DashboardSearch({ patients }: DashboardSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [isDeepConsult, setIsDeepConsult] = useState(false);
  const [clinicalLens, setClinicalLens] = useState<"functional" | "conventional" | "both">("functional");
  const [selectedSources, setSelectedSources] = useState<SourceId[]>([...ALL_SOURCE_IDS]);
  const [showSourceFilter, setShowSourceFilter] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    if (attachments.length + files.length > 5) {
      toast.error("Maximum 5 attachments allowed");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10_485_760) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/chat/attachments", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }

        const attachment: ChatAttachment = await res.json();
        setAttachments((prev) => [...prev, attachment]);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [attachments.length]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams();
    params.set("q", query.trim());
    if (patientId) params.set("patient_id", patientId);
    if (isDeepConsult) params.set("deep_consult", "true");
    if (clinicalLens !== "functional") params.set("clinical_lens", clinicalLens);
    if (!isDefaultSelection(selectedSources)) params.set("source_filter", selectedSources.join(","));

    // Store attachments in sessionStorage for handoff to chat page
    if (attachments.length > 0) {
      const key = `attach_${Date.now()}`;
      sessionStorage.setItem(key, JSON.stringify(attachments));
      params.set("attach_key", key);
    }

    router.push(`/chat?${params}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] shadow-[var(--shadow-elevated)] hover:border-[var(--color-brand-400)] transition-all focus-within:border-[var(--color-brand-400)] focus-within:shadow-[var(--shadow-focus)]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a clinical question..."
          className="w-full px-4 sm:px-6 py-4 text-base bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] rounded-[var(--radius-lg)]"
          autoFocus
        />
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 sm:px-6 pb-2">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)] rounded-full"
              >
                <Paperclip className="w-3 h-3" />
                {a.name}
                <span className="text-[var(--color-text-muted)]">
                  ({(a.size / 1_048_576).toFixed(1)} MB)
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  className="ml-0.5 text-[var(--color-brand-500)] hover:text-red-600 transition-colors"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {uploading && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[var(--color-text-muted)]">
                <Loader2 className="w-3 h-3 animate-spin text-[var(--color-brand-500)]" />
                Uploading...
              </span>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 pb-3">
          {/* Attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || attachments.length >= 5}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--color-text-secondary)] bg-transparent border border-[var(--color-border)] hover:border-[var(--color-brand-300)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin text-[var(--color-brand-500)]" />
            ) : (
              <Paperclip className="w-3 h-3" />
            )}
            Attach
          </button>

          {/* Select Patient */}
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="text-xs text-[var(--color-text-secondary)] bg-transparent border border-[var(--color-border)] rounded-full px-3 py-1.5 outline-none hover:border-[var(--color-brand-300)] transition-colors cursor-pointer"
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"}
              </option>
            ))}
          </select>

          {/* Clinical Lens toggle */}
          <button
            type="button"
            onClick={() => {
              const next = clinicalLens === "functional" ? "both" : clinicalLens === "both" ? "conventional" : "functional";
              setClinicalLens(next);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              clinicalLens !== "functional"
                ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-300)]"
                : "text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-500)] hover:border-[var(--color-brand-200)]"
            }`}
          >
            <Stethoscope className="w-3 h-3" />
            {clinicalLens === "functional" ? "Functional" : clinicalLens === "conventional" ? "Conventional" : "Both"}
            {clinicalLens !== "functional" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
            )}
          </button>

          {/* Source Filter toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSourceFilter(!showSourceFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                !isDefaultSelection(selectedSources)
                  ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-300)]"
                  : "text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand-300)]"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              {getSourceLabel(selectedSources)}
              {!isDefaultSelection(selectedSources) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
              )}
            </button>

            {showSourceFilter && (
              <SourceFilterPopover
                selectedSources={selectedSources}
                onChangeSources={setSelectedSources}
                onClose={() => setShowSourceFilter(false)}
              />
            )}
          </div>

          {/* Deep Consult toggle */}
          <button
            type="button"
            onClick={() => setIsDeepConsult(!isDeepConsult)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              isDeepConsult
                ? "bg-[var(--color-gold-50)] text-[var(--color-gold-700)] border-[var(--color-gold-300)]"
                : "text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-gold-50)] hover:text-[var(--color-gold-700)] hover:border-[var(--color-gold-200)]"
            }`}
          >
            <Microscope className="w-3 h-3" />
            Deep Consult
            {isDeepConsult && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-500)]" />
            )}
          </button>

          {/* Submit button — pushed to right */}
          <button
            type="submit"
            disabled={!query.trim()}
            className="ml-auto w-9 h-9 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" stroke="white" />
          </button>
        </div>
      </div>
    </form>
  );
}
