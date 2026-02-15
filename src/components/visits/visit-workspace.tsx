"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar, User, Sparkles, Check, RotateCcw,
  Stethoscope, RefreshCcw, Loader2, StopCircle, ClipboardList,
  Grid3x3, Pill, HeartPulse, UserCheck, Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { RawNotesInput } from "./raw-notes-input";

const VisitEditor = dynamic(
  () => import("./editor/visit-editor").then((mod) => ({ default: mod.VisitEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <div className="w-4 h-4 border-2 border-[var(--color-brand-300)] border-t-transparent rounded-full animate-spin" />
          Loading editor...
        </div>
      </div>
    ),
  }
);
import { SoapSections } from "./soap-sections";
import { IFMMatrixView } from "./ifm-matrix-view";
import { ProtocolPanel } from "./protocol-panel";
import { ExportMenu } from "./export-menu";
import { useVisitStream } from "@/hooks/use-visit-stream";
import type { Visit, VisitType, IFMMatrix } from "@/types/database";
import type { JSONContent } from "@tiptap/react";

type Tab = "soap" | "ifm" | "protocol";

interface VisitWorkspaceProps {
  visit: Visit & {
    patients?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
  };
}

const VISIT_TYPE_LABELS: Record<string, string> = {
  soap: "SOAP",
  follow_up: "Follow-up",
  history_physical: "H&P",
  consult: "Consult",
};

const VISIT_TYPE_ICONS: Record<string, typeof ClipboardList> = {
  soap: ClipboardList,
  follow_up: RefreshCcw,
  history_physical: HeartPulse,
  consult: UserCheck,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function VisitWorkspace({ visit: initialVisit }: VisitWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoGenerate = searchParams.get("generate") === "true";
  const autoTranscribe = searchParams.get("mode") === "transcribe";

  const [visit, setVisit] = useState(initialVisit);
  const [activeTab, setActiveTab] = useState<Tab>("soap");
  const [rawNotes, setRawNotes] = useState(visit.raw_notes || "");
  const [showNotes, setShowNotes] = useState(!visit.subjective || autoTranscribe);
  const [saving, setSaving] = useState(false);

  // Track editor content for block editor mode
  const editorJsonRef = useRef<JSONContent | null>(null);
  const editorTextRef = useRef<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stream = useVisitStream();
  const isReadOnly = visit.status === "completed";
  const patientName = visit.patients
    ? [visit.patients.first_name, visit.patients.last_name].filter(Boolean).join(" ")
    : null;

  // Determine if this visit uses the block editor
  // New visits always use block editor; old visits with only raw_notes use legacy textarea
  const useBlockEditor = visit.template_content != null || !visit.raw_notes;

  const VisitIcon = VISIT_TYPE_ICONS[visit.visit_type] || Stethoscope;
  const isFollowUp = visit.visit_type === "follow_up";

  // Auto-generate on mount if redirected from new visit with notes
  useEffect(() => {
    if (autoGenerate && rawNotes.trim() && visit.status === "draft") {
      stream.generate(visit.id, rawNotes);
    }
    // Clean URL params on mount
    if (autoGenerate || autoTranscribe) {
      window.history.replaceState({}, "", `/visits/${visit.id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update local visit state when AI generation completes
  useEffect(() => {
    if (stream.soap.status === "complete" && stream.soap.data) {
      setVisit((prev) => ({
        ...prev,
        subjective: stream.soap.data.subjective || prev.subjective,
        objective: stream.soap.data.objective || prev.objective,
        assessment: stream.soap.data.assessment || prev.assessment,
        plan: stream.soap.data.plan || prev.plan,
      }));
      setShowNotes(false);
    }
  }, [stream.soap.status, stream.soap.data]);

  useEffect(() => {
    if (stream.ifm_matrix.status === "complete" && stream.ifm_matrix.data) {
      setVisit((prev) => ({ ...prev, ifm_matrix: stream.ifm_matrix.data }));
    }
  }, [stream.ifm_matrix.status, stream.ifm_matrix.data]);

  useEffect(() => {
    if (stream.protocol.status === "complete" && stream.protocol.data) {
      setVisit((prev) => ({ ...prev, ai_protocol: stream.protocol.data }));
    }
  }, [stream.protocol.status, stream.protocol.data]);

  // Generate from block editor content
  const handleGenerate = useCallback(() => {
    const text = useBlockEditor ? editorTextRef.current : rawNotes;
    if (!text.trim()) return;

    // Confirm before overwriting existing SOAP content
    const hasExistingContent = !!(visit.subjective || visit.objective || visit.assessment || visit.plan);
    if (hasExistingContent) {
      const confirmed = window.confirm(
        "This will regenerate all SOAP sections and overwrite any manual edits. Continue?"
      );
      if (!confirmed) return;
    }

    // Save editor state before generating
    if (useBlockEditor && editorJsonRef.current) {
      fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_content: editorJsonRef.current,
          raw_notes: text,
        }),
      });
    }

    stream.generate(visit.id, text);
  }, [visit.id, rawNotes, stream, useBlockEditor, visit.subjective, visit.objective, visit.assessment, visit.plan]);

  // Handle block editor content changes (debounced auto-save)
  const handleEditorContentChange = useCallback(
    (json: JSONContent, text: string) => {
      editorJsonRef.current = json;
      editorTextRef.current = text;
      setRawNotes(text);

      // Debounced auto-save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/visits/${visit.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              template_content: json,
              raw_notes: text,
            }),
          });
        } catch {
          toast.error("Failed to save changes. Your edits are preserved locally.");
        }
        setSaving(false);
      }, 2000);
    },
    [visit.id]
  );

  const handleFieldUpdate = useCallback(async (field: string, value: string) => {
    setVisit((prev) => ({ ...prev, [field]: value }));

    setSaving(true);
    await fetch(`/api/visits/${visit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
  }, [visit.id]);

  const handleMatrixUpdate = useCallback(async (matrix: IFMMatrix) => {
    setVisit((prev) => ({ ...prev, ifm_matrix: matrix }));
    setSaving(true);
    await fetch(`/api/visits/${visit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ifm_matrix: matrix }),
    });
    setSaving(false);
  }, [visit.id]);

  const handleStatusToggle = useCallback(async () => {
    const newStatus = visit.status === "draft" ? "completed" : "draft";
    const res = await fetch(`/api/visits/${visit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setVisit((prev) => ({ ...prev, status: newStatus }));
      router.refresh();
    }
  }, [visit.id, visit.status, router]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete this visit? This cannot be undone.")) return;

    const res = await fetch(`/api/visits/${visit.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Visit deleted");
      router.push("/visits");
    } else {
      toast.error("Failed to delete visit");
    }
  }, [visit.id, router]);

  const tabs: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
    { key: "soap", label: "SOAP Note", icon: ClipboardList },
    { key: "ifm", label: "IFM Matrix", icon: Grid3x3 },
    { key: "protocol", label: "Protocol", icon: Pill },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-3">
            <Link
              href="/visits"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Visits
            </Link>
            {patientName && (
              <>
                <span className="text-[var(--color-text-muted)]">&gt;</span>
                <Link
                  href={`/patients/${visit.patients?.id}`}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  {patientName}
                </Link>
              </>
            )}
            <span className="text-[var(--color-text-muted)]">&gt;</span>
            <span className="text-[var(--color-text-primary)]">
              {new Date(visit.visit_date).toLocaleDateString()}
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isFollowUp
              ? "bg-[var(--color-gold-50)] border border-[var(--color-gold-200)]"
              : "bg-[var(--color-brand-50)] border border-[var(--color-brand-100)]"
              }`}>
              <VisitIcon
                className={`w-4.5 h-4.5 ${isFollowUp ? "text-[var(--color-gold-600)]" : "text-[var(--color-brand-600)]"}`}
                strokeWidth={1.5}
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {visit.chief_complaint || "Visit Note"}
              </h1>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(visit.visit_date)}
                </span>
                {patientName && (
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {patientName}
                  </span>
                )}
                <span>{VISIT_TYPE_LABELS[visit.visit_type] || "SOAP"}</span>
                {saving && (
                  <span className="text-[var(--color-brand-500)]">Saving...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-[var(--radius-md)] transition-colors border border-transparent hover:border-red-200"
              title="Delete Visit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <ExportMenu visit={visit} />
          <button
            onClick={handleStatusToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border transition-colors ${visit.status === "completed"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
          >
            {visit.status === "completed" ? (
              <><RotateCcw className="w-3 h-3" /> Unlock & Edit</>
            ) : (
              <><Check className="w-3 h-3" /> Sign & Lock Note</>
            )}
          </button>
        </div>
      </div>

      {/* Notes input (collapsible) */}
      {!isReadOnly && (
        <div className="mb-6">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-2"
          >
            {showNotes ? "Hide notes" : "Show notes"}
          </button>
          {showNotes && (
            <div className="space-y-3">
              {useBlockEditor ? (
                <VisitEditor
                  visitType={visit.visit_type as VisitType}
                  visitId={visit.id}
                  initialContent={visit.template_content as JSONContent | null}
                  autoTranscribe={autoTranscribe}
                  disabled={stream.isGenerating}
                  onContentChange={handleEditorContentChange}
                  onCompleteNote={handleGenerate}
                />
              ) : (
                <RawNotesInput
                  value={rawNotes}
                  onChange={setRawNotes}
                  visitType={visit.visit_type as "soap" | "follow_up" | "history_physical" | "consult"}
                  visitId={visit.id}
                  disabled={stream.isGenerating}
                  initialMode={autoTranscribe ? "transcribe" : undefined}
                  onCompleteNote={handleGenerate}
                />
              )}
              <div className="flex items-center gap-3">
                {stream.isGenerating ? (
                  <button
                    onClick={stream.abort}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)] hover:bg-red-100 transition-colors"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Generation
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={useBlockEditor ? !editorTextRef.current.trim() : !rawNotes.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    {visit.subjective ? "Regenerate" : "Generate Clinical Note"}
                  </button>
                )}
                {stream.isGenerating && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {stream.error && (
        <div role="alert" className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
          {stream.error}
        </div>
      )}

      {/* Tab bar */}
      <div role="tablist" aria-label="Visit sections" className="flex items-center gap-1 mb-6 border-b border-[var(--color-border-light)]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`tabpanel-${key}`}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === key
              ? "border-[var(--color-brand-600)] text-[var(--color-brand-700)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="min-h-[400px]">
        {activeTab === "soap" && (
          <SoapSections
            subjective={visit.subjective || ""}
            objective={visit.objective || ""}
            assessment={visit.assessment || ""}
            plan={visit.plan || ""}
            soapStatus={stream.soap.status}
            streamingText={stream.soap.rawText}
            readOnly={isReadOnly}
            onUpdate={handleFieldUpdate}
          />
        )}
        {activeTab === "ifm" && (
          <IFMMatrixView
            matrix={visit.ifm_matrix}
            status={stream.ifm_matrix.status}
            readOnly={isReadOnly}
            onUpdate={handleMatrixUpdate}
          />
        )}
        {activeTab === "protocol" && (
          <ProtocolPanel
            protocol={visit.ai_protocol}
            status={stream.protocol.status}
          />
        )}
      </div>
    </div>
  );
}
