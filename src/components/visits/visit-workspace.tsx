"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar, User, Sparkles, Check, RotateCcw,
  Stethoscope, RefreshCcw, Loader2, StopCircle, ClipboardList,
  Grid3x3, Pill, HeartPulse, UserCheck, Trash2, Activity,
  Mic, Square, Play, Pause,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { RawNotesInput } from "./raw-notes-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
import { VitalsPanel } from "./vitals-panel";
import { ExportMenu } from "./export-menu";
import { VisitAssistant } from "./visit-assistant";
import { useVisitStream } from "@/hooks/use-visit-stream";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import type { Visit, VisitType, IFMMatrix, VitalsData, HealthRatings } from "@/types/database";
import type { JSONContent } from "@tiptap/react";

type Tab = "soap" | "ifm" | "protocol" | "intake";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface PreviousVitalsContext {
  vitals: VitalsData | null;
  ratings: HealthRatings | null;
  date: string;
}

interface VisitWorkspaceProps {
  visit: Visit & {
    patients?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      date_of_birth: string | null;
      sex: string | null;
      chief_complaints: string[] | null;
      medical_history: string | null;
      current_medications: string | null;
      supplements: string | null;
      allergies: string[] | null;
      notes: string | null;
    } | null;
  };
  patients?: PatientOption[];
  previousVitalsContext?: PreviousVitalsContext | null;
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

function formatRecorderDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function VisitWorkspace({ visit: initialVisit, patients = [], previousVitalsContext = null }: VisitWorkspaceProps) {
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

  // Undo AI Generation — snapshot state before generation
  const preGenSnapshotRef = useRef<Pick<Visit, "subjective" | "objective" | "assessment" | "plan" | "ifm_matrix" | "ai_protocol"> | null>(null);
  const patientName = visit.patients
    ? [visit.patients.first_name, visit.patients.last_name].filter(Boolean).join(" ")
    : null;

  // Determine if this visit uses the block editor
  // New visits always use block editor; old visits with only raw_notes use legacy textarea
  const useBlockEditor = visit.template_content != null || !visit.raw_notes;

  const VisitIcon = VISIT_TYPE_ICONS[visit.visit_type] || Stethoscope;
  const isFollowUp = visit.visit_type === "follow_up";

  // Detect fresh/new visit — editable type + patient selectors
  const isFreshVisit = !visit.raw_notes && !visit.subjective && !visit.objective && !visit.assessment && !visit.plan && !visit.template_content;
  const [updatingVisitType, setUpdatingVisitType] = useState(false);
  const [updatingPatient, setUpdatingPatient] = useState(false);

  const handleVisitTypeChange = useCallback(async (newType: string) => {
    setUpdatingVisitType(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visit_type: newType }),
      });
      if (res.ok) {
        setVisit((prev) => ({ ...prev, visit_type: newType as VisitType }));
      }
    } catch {
      toast.error("Failed to update visit type");
    }
    setUpdatingVisitType(false);
  }, [visit.id]);

  const handlePatientChange = useCallback(async (patientId: string) => {
    setUpdatingPatient(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId || null }),
      });
      if (res.ok) {
        const selected = patients.find((p) => p.id === patientId);
        setVisit((prev) => ({
          ...prev,
          patient_id: patientId || null,
          patients: selected ? {
            id: selected.id,
            first_name: selected.first_name,
            last_name: selected.last_name,
            date_of_birth: null,
            sex: null,
            chief_complaints: null,
            medical_history: null,
            current_medications: null,
            supplements: null,
            allergies: null,
            notes: null,
          } : null,
        }));
      }
    } catch {
      toast.error("Failed to update patient");
    }
    setUpdatingPatient(false);
  }, [visit.id, patients]);

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

      // Show undo toast if we have a snapshot
      if (preGenSnapshotRef.current) {
        const snapshot = preGenSnapshotRef.current;
        toast("AI generation complete", {
          description: "SOAP note has been updated",
          action: {
            label: "Undo",
            onClick: () => {
              setVisit((prev) => ({ ...prev, ...snapshot }));
              // Persist the undo to the server
              fetch(`/api/visits/${visit.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subjective: snapshot.subjective,
                  objective: snapshot.objective,
                  assessment: snapshot.assessment,
                  plan: snapshot.plan,
                }),
              });
              toast.success("AI generation undone");
            },
          },
          duration: 10000,
        });
        preGenSnapshotRef.current = null;
      }
    }
  }, [stream.soap.status, stream.soap.data, visit.id]);

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

  // Regeneration confirmation state
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  // Push to Patient Matrix state
  const [showPushConfirm, setShowPushConfirm] = useState(false);
  const [pushing, setPushing] = useState(false);

  // Push Protocol Supplements state
  const [showPushProtocolConfirm, setShowPushProtocolConfirm] = useState(false);
  const [pushingProtocol, setPushingProtocol] = useState(false);
  const [protocolPushedAt, setProtocolPushedAt] = useState<string | null>(
    visit.protocol_pushed_at || null
  );

  // Assistant drawer state
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Track if screen is md+ for assistant margin shift
  const [isMdScreen, setIsMdScreen] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setIsMdScreen(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMdScreen(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Push visit to patient timeline state
  const [pushingToRecord, setPushingToRecord] = useState(false);
  const [pushedToRecord, setPushedToRecord] = useState<"idle" | "pushed" | "already">( "idle");

  // Push vitals to patient chart state
  const [pushingVitals, setPushingVitals] = useState(false);
  const [vitalsPushedAt, setVitalsPushedAt] = useState<string | null>(
    visit.vitals_pushed_at || null
  );

  // --- Encounter Recorder (workspace-level AI Scribe) ---
  const encounterRecorder = useAudioRecorder({
    maxDuration: 3600, // 60 min for full encounters
    autoSave: { visitId: visit.id },
    onError: (err) => toast.error(err),
  });
  const [scribeStatus, setScribeStatus] = useState<"idle" | "transcribing" | "assigning" | "done" | "error">("idle");
  const [scribedSections, setScribedSections] = useState<Record<string, string> | null>(null);
  const [isPlayingEncounter, setIsPlayingEncounter] = useState(false);
  const [encounterAudioEl, setEncounterAudioEl] = useState<HTMLAudioElement | null>(null);

  const isScribing = scribeStatus === "transcribing" || scribeStatus === "assigning";

  const handleEncounterPlayPause = useCallback(() => {
    if (!encounterRecorder.audioUrl) return;
    if (encounterAudioEl && isPlayingEncounter) {
      encounterAudioEl.pause();
      setIsPlayingEncounter(false);
      return;
    }
    const audio = new Audio(encounterRecorder.audioUrl);
    audio.onended = () => setIsPlayingEncounter(false);
    audio.play();
    setEncounterAudioEl(audio);
    setIsPlayingEncounter(true);
  }, [encounterRecorder.audioUrl, encounterAudioEl, isPlayingEncounter]);

  const handleEncounterScribe = useCallback(async () => {
    if (!encounterRecorder.audioBlob) return;

    setScribeStatus("transcribing");
    try {
      // Step 1: Upload audio to storage, then transcribe via Whisper
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const storagePath = `audio/${visit.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("patient-documents")
        .upload(storagePath, encounterRecorder.audioBlob, { contentType: encounterRecorder.audioBlob.type, upsert: true });
      if (uploadError) throw new Error(`Audio upload failed: ${uploadError.message}`);

      const transcribeRes = await fetch(`/api/visits/${visit.id}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_storage_path: storagePath }),
      });
      if (!transcribeRes.ok) {
        const data = await transcribeRes.json().catch(() => ({}));
        throw new Error(data.error || "Transcription failed");
      }
      const { transcript } = await transcribeRes.json();

      // Step 2: Assign transcript to note sections via AI Scribe
      setScribeStatus("assigning");
      const scribeRes = await fetch(`/api/visits/${visit.id}/scribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!scribeRes.ok) {
        const data = await scribeRes.json().catch(() => ({}));
        throw new Error(data.error || "Section assignment failed");
      }
      const { sections } = await scribeRes.json();

      // Pass sections to VisitEditor for population
      setScribedSections(sections);
      setScribeStatus("done");
      setShowNotes(true);
      encounterRecorder.clear();
      toast.success("Encounter processed — review your note sections below");

      // Reset done status after delay
      setTimeout(() => setScribeStatus("idle"), 4000);
    } catch (err) {
      setScribeStatus("error");
      toast.error(err instanceof Error ? err.message : "AI Scribe failed");
      setTimeout(() => setScribeStatus("idle"), 4000);
    }
  }, [encounterRecorder.audioBlob, encounterRecorder.clear, visit.id]);

  const handleEncounterDiscard = useCallback(() => {
    if (encounterAudioEl) {
      encounterAudioEl.pause();
      setIsPlayingEncounter(false);
    }
    encounterRecorder.clear();
  }, [encounterAudioEl, encounterRecorder]);

  // Generate from block editor content
  const handleGenerate = useCallback(() => {
    const text = useBlockEditor ? editorTextRef.current : rawNotes;
    if (!text.trim()) return;

    // Show confirmation dialog before overwriting existing SOAP content
    const hasExistingContent = !!(visit.subjective || visit.objective || visit.assessment || visit.plan);
    if (hasExistingContent) {
      setShowRegenConfirm(true);
      return;
    }

    doGenerate();
  }, [rawNotes, useBlockEditor, visit.subjective, visit.objective, visit.assessment, visit.plan]); // eslint-disable-line react-hooks/exhaustive-deps

  const doGenerate = useCallback(() => {
    const text = useBlockEditor ? editorTextRef.current : rawNotes;

    // Snapshot current SOAP state for undo
    preGenSnapshotRef.current = {
      subjective: visit.subjective,
      objective: visit.objective,
      assessment: visit.assessment,
      plan: visit.plan,
      ifm_matrix: visit.ifm_matrix,
      ai_protocol: visit.ai_protocol,
    };

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
    setShowRegenConfirm(false);
  }, [visit.id, rawNotes, stream, useBlockEditor]);

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
    try {
      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      toast.error("Failed to save changes. Your edits are preserved locally.");
    }
    setSaving(false);
  }, [visit.id]);

  const handleMatrixUpdate = useCallback(async (matrix: IFMMatrix) => {
    setVisit((prev) => ({ ...prev, ifm_matrix: matrix }));
    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ifm_matrix: matrix }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      toast.error("Failed to save IFM Matrix. Your edits are preserved locally.");
    }
    setSaving(false);
  }, [visit.id]);

  const handlePushToRecord = useCallback(async () => {
    if (!visit.patients?.id) return;
    setPushingToRecord(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}/push-to-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to push to timeline");
      }
      const { already_existed } = await res.json();
      setPushedToRecord(already_existed ? "already" : "pushed");
      toast.success(already_existed ? "Already on patient timeline — updated" : "Visit added to patient timeline");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push to timeline");
    } finally {
      setPushingToRecord(false);
    }
  }, [visit.id, visit.patients?.id]);

  const handlePushVitalsToChart = useCallback(async () => {
    if (!visit.patients?.id) return;
    setPushingVitals(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}/push-vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to push vitals");
      }
      const { already_existed } = await res.json();
      setVitalsPushedAt(new Date().toISOString());
      toast.success(
        already_existed
          ? "Patient chart updated with latest vitals"
          : "Vitals & health ratings pushed to patient chart"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push vitals");
    } finally {
      setPushingVitals(false);
    }
  }, [visit.id, visit.patients?.id]);

  const handlePatientFieldSaved = useCallback((field: string, value: unknown) => {
    setVisit((prev) => ({
      ...prev,
      patients: prev.patients ? { ...prev.patients, [field]: value } : prev.patients,
    }));
  }, []);

  const handleVitalsSaved = useCallback((vitals: VitalsData | null, ratings: HealthRatings | null) => {
    setVisit((prev) => ({
      ...prev,
      vitals_data: vitals,
      health_ratings: ratings,
    }));
  }, []);

  const handlePushToPatientMatrix = useCallback(async () => {
    if (!visit.patients?.id) return;
    setPushing(true);
    try {
      const res = await fetch(`/api/patients/${visit.patients.id}/ifm-matrix/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visit_id: visit.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to push matrix");
      }
      toast.success("IFM Matrix merged into patient profile");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push matrix");
    } finally {
      setPushing(false);
      setShowPushConfirm(false);
    }
  }, [visit.id, visit.patients?.id]);

  const handlePushProtocolSupplements = useCallback(async () => {
    if (!visit.patients?.id) return;
    setPushingProtocol(true);
    try {
      const res = await fetch(
        `/api/patients/${visit.patients.id}/supplements/push-protocol`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visit_id: visit.id }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to push supplements");
      }
      const { results } = await res.json();
      setProtocolPushedAt(new Date().toISOString());
      toast.success(
        `Protocol supplements pushed: ${results.added} added, ${results.updated} updated`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push supplements");
    } finally {
      setPushingProtocol(false);
      setShowPushProtocolConfirm(false);
    }
  }, [visit.id, visit.patients?.id]);

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
      router.refresh();
      router.push("/visits");
    } else {
      toast.error("Failed to delete visit");
    }
  }, [visit.id, router]);

  const tabs: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
    { key: "intake", label: "Vitals & Ratings", icon: Activity },
    { key: "soap", label: "SOAP Note", icon: ClipboardList },
    { key: "ifm", label: "IFM Matrix", icon: Grid3x3 },
    { key: "protocol", label: "Protocol", icon: Pill },
  ];

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-6 transition-[margin-right] duration-300 ease-in-out"
      style={{ marginRight: assistantOpen && isMdScreen ? "min(360px, 35vw)" : undefined }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
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
                {isFreshVisit && (
                  <select
                    value={visit.visit_type}
                    onChange={(e) => handleVisitTypeChange(e.target.value)}
                    disabled={updatingVisitType}
                    className="text-xs font-medium bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-sm)] px-2 py-0.5 text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] cursor-pointer disabled:opacity-50"
                  >
                    {Object.entries(VISIT_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                )}
                {!isFreshVisit && (
                  <span>{VISIT_TYPE_LABELS[visit.visit_type] || "SOAP"}</span>
                )}
                {visit.patient_id ? (
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {patientName}
                  </span>
                ) : (
                  <select
                    value=""
                    onChange={(e) => handlePatientChange(e.target.value)}
                    disabled={updatingPatient}
                    className="text-xs font-medium bg-amber-50 border border-amber-200 rounded-[var(--radius-sm)] px-2 py-0.5 text-amber-700 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] cursor-pointer disabled:opacity-50 max-w-[200px]"
                  >
                    <option value="">Assign to patient…</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {[p.last_name, p.first_name].filter(Boolean).join(", ") || "Unnamed"}
                      </option>
                    ))}
                  </select>
                )}
                {saving && (
                  <span className="text-[var(--color-brand-500)]">Saving...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {!isReadOnly && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-[var(--radius-md)] transition-colors border border-transparent hover:border-red-200"
              title="Delete Visit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {visit.patients?.id && (
            <button
              onClick={handlePushToRecord}
              disabled={pushingToRecord}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border transition-colors disabled:opacity-50 ${
                pushedToRecord === "already"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : pushedToRecord === "pushed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]"
              }`}
              title="Push visit summary to patient timeline"
            >
              {pushingToRecord ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <User className="w-3 h-3" />
              )}
              {pushedToRecord === "already" ? "Already on Timeline" : pushedToRecord === "pushed" ? "On Timeline ✓" : "Push to Timeline"}
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

      {/* Encounter Recorder — prominent card for recording the full encounter */}
      {!isReadOnly && encounterRecorder.isSupported && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] overflow-hidden">
          {/* Recording idle — show prominent CTA or compact re-record bar */}
          {!encounterRecorder.isRecording && !encounterRecorder.audioBlob && !isScribing && scribeStatus !== "done" && (
            visit.subjective ? (
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Re-record encounter to regenerate note
                  </span>
                </div>
                <button
                  onClick={encounterRecorder.start}
                  disabled={stream.isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
                >
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  Re-record
                </button>
              </div>
            ) : (
              <div className="px-6 py-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mic className="w-5 h-5 text-[var(--color-brand-600)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Record Encounter</h3>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mb-5 max-w-md mx-auto">
                  Record your patient encounter and AI will generate a structured clinical note from the conversation.
                </p>
                <button
                  onClick={encounterRecorder.start}
                  disabled={stream.isGenerating}
                  className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-white bg-[var(--color-brand-600)] rounded-full hover:bg-[var(--color-brand-500)] transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="w-3 h-3 bg-red-400 rounded-full" />
                  Record Encounter
                </button>
              </div>
            )
          )}

          {/* Recording in progress */}
          {encounterRecorder.isRecording && (
            <div className="px-6 py-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600">Recording encounter</span>
                <span className="text-sm font-[var(--font-mono)] text-[var(--color-text-secondary)]">
                  {formatRecorderDuration(encounterRecorder.durationSeconds)}
                </span>
              </div>
              <button
                onClick={encounterRecorder.stop}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Recording
              </button>
            </div>
          )}

          {/* Recording complete — process or discard */}
          {encounterRecorder.audioBlob && !encounterRecorder.isRecording && !isScribing && scribeStatus !== "done" && (
            <div className="px-4 sm:px-6 py-5 flex items-center justify-center gap-3 flex-wrap">
              <span className="text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">
                {formatRecorderDuration(encounterRecorder.durationSeconds)}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">recorded</span>
              <span className="w-px h-5 bg-[var(--color-border-light)]" />
              <button
                onClick={handleEncounterPlayPause}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                {isPlayingEncounter ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlayingEncounter ? "Pause" : "Play"}
              </button>
              <button
                onClick={handleEncounterScribe}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[var(--color-brand-600)] rounded-full hover:bg-[var(--color-brand-500)] transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Process with AI Scribe
              </button>
              <button
                onClick={handleEncounterDiscard}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                title="Discard recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Processing — transcribing or assigning */}
          {isScribing && (
            <div className="px-6 py-5 flex items-center justify-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brand-600)]" />
              <span className="text-sm font-medium text-[var(--color-brand-600)]">
                {scribeStatus === "transcribing" ? "Transcribing audio..." : "Assigning to note sections..."}
              </span>
            </div>
          )}

          {/* Done */}
          {scribeStatus === "done" && (
            <div className="px-6 py-4 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
              <Check className="w-4 h-4" />
              Note sections populated — review below
            </div>
          )}
        </div>
      )}

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
                  scribedSections={scribedSections}
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div role="tablist" aria-label="Visit sections" className="flex items-center gap-1 mb-6 border-b border-[var(--color-border-light)] overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`tabpanel-${key}`}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex-shrink-0 ${activeTab === key
              ? "border-[var(--color-brand-600)] text-[var(--color-brand-700)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="min-h-[400px]">
        {activeTab === "intake" && (
          <VitalsPanel
            visitId={visit.id}
            initialVitals={(visit.vitals_data as VitalsData) ?? null}
            initialRatings={(visit.health_ratings as HealthRatings) ?? null}
            readOnly={isReadOnly}
            patientId={visit.patients?.id}
            patient={visit.patients ? {
              id: visit.patients.id,
              chief_complaints: visit.patients.chief_complaints,
              medical_history: visit.patients.medical_history,
              current_medications: visit.patients.current_medications,
              allergies: visit.patients.allergies,
              notes: visit.patients.notes,
            } : null}
            onPatientFieldSaved={handlePatientFieldSaved}
            previousVitals={previousVitalsContext?.vitals ?? null}
            previousRatings={previousVitalsContext?.ratings ?? null}
            previousDate={previousVitalsContext?.date ?? null}
            onPushToChart={handlePushVitalsToChart}
            pushingToChart={pushingVitals}
            vitalsPushedAt={vitalsPushedAt}
            onVitalsSaved={handleVitalsSaved}
          />
        )}
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
          <div className="space-y-4">
            {visit.patients?.id && visit.ifm_matrix && Object.keys(visit.ifm_matrix).length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPushConfirm(true)}
                  disabled={pushing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-600)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-100)] transition-colors disabled:opacity-50"
                >
                  {pushing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                  Push to Patient Matrix
                </button>
              </div>
            )}
            <IFMMatrixView
              matrix={visit.ifm_matrix}
              status={stream.ifm_matrix.status}
              readOnly={isReadOnly}
              hasSoapNote={!!(visit.subjective || visit.objective || visit.assessment || visit.plan)}
              onUpdate={handleMatrixUpdate}
            />
          </div>
        )}
        {activeTab === "protocol" && (
          <div className="space-y-4">
            {visit.patients?.id && visit.ai_protocol?.supplements?.length > 0 && (
              <div className="flex items-center justify-end gap-3">
                {protocolPushedAt && (
                  <span className="text-xs text-emerald-600 font-medium">
                    Pushed {new Date(protocolPushedAt).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={() => setShowPushProtocolConfirm(true)}
                  disabled={pushingProtocol}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-600)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-100)] transition-colors disabled:opacity-50"
                >
                  {pushingProtocol ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Pill className="w-3.5 h-3.5" />
                  )}
                  {protocolPushedAt ? "Re-push Protocol" : "Push Protocol to Patient File"}
                </button>
              </div>
            )}
            <ProtocolPanel
              protocol={visit.ai_protocol}
              status={stream.protocol.status}
              hasSoapNote={!!(visit.subjective || visit.objective || visit.assessment || visit.plan)}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showRegenConfirm}
        onConfirm={doGenerate}
        onCancel={() => setShowRegenConfirm(false)}
        title="Regenerate clinical note?"
        description="This will overwrite all SOAP sections, IFM Matrix, and Protocol recommendations with new AI-generated content. Any manual edits will be lost."
        confirmLabel="Regenerate"
        variant="warning"
      />

      <ConfirmDialog
        open={showPushConfirm}
        onConfirm={handlePushToPatientMatrix}
        onCancel={() => setShowPushConfirm(false)}
        title="Push to Patient Matrix?"
        description="This will merge findings from this visit into the patient's persistent IFM Matrix. Existing findings are preserved — new findings, higher severity levels, and notes will be added."
        confirmLabel="Push to Patient"
        variant="warning"
        loading={pushing}
      />

      <ConfirmDialog
        open={showPushProtocolConfirm}
        onConfirm={handlePushProtocolSupplements}
        onCancel={() => setShowPushProtocolConfirm(false)}
        title={protocolPushedAt ? "Re-push protocol to patient file?" : "Push protocol to patient file?"}
        description={
          protocolPushedAt
            ? "This will update the patient's supplement list, dietary recommendations, lifestyle recommendations, and follow-up labs with the latest protocol."
            : "This will add the protocol's supplement, dietary, lifestyle, and follow-up lab recommendations to the patient's file and create timeline events for each change."
        }
        confirmLabel={protocolPushedAt ? "Re-push Protocol" : "Push Protocol"}
        variant="warning"
        loading={pushingProtocol}
      />

      <VisitAssistant visitId={visit.id} patientName={patientName} onOpenChange={setAssistantOpen} />
    </div>
  );
}
