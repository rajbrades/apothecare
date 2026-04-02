 "use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  User, Calendar, FileText, ClipboardList, Grid3x3,
  Stethoscope, Loader2, Clock, TrendingUp,
  Archive, ArchiveRestore, ChevronDown, ExternalLink,
  Trash2, AlertTriangle, MoreVertical, GitBranch,
  Salad, HeartPulse, FlaskConical,
  Mail, Phone, MapPin, Users,
} from "lucide-react";
import { toast } from "sonner";
import { CreateVisitButton } from "@/components/visits/create-visit-button";
import { InviteToPortalButton } from "@/components/portal/invite-to-portal-button";
import { DocumentUpload } from "./document-upload";
import { DocumentList } from "./document-list";
import { PopulateFromDocsBanner } from "./populate-from-docs";
import { LabDetailSheet } from "@/components/labs/lab-detail-sheet";
import { DocumentDetailSheet } from "./document-detail-sheet";
import { PreChartView } from "./pre-chart-view";
import { SupplementList } from "./supplement-list";
import { MedicationList } from "./medication-list";
import { SectionShell, EditableTextSection, EditableTagSection } from "@/components/ui/editable-sections";
import type { Patient, PatientDocument, PatientSupplement, ProtocolItem, FMTimelineData, FMCategory, FMLifeStage, DocumentType } from "@/types/database";
import { GenerateProtocolButton } from "@/components/protocols/generate-protocol-button";
import { ProtocolList } from "@/components/protocols/protocol-list";
import { ActiveProtocolCard } from "@/components/protocols/active-protocol-card";
import type { LabReportStatus, LabVendor, LabTestType } from "@/types/database";
import type { TimelineEvent } from "@/hooks/use-timeline";

const BiomarkerTimeline = dynamic(
  () => import("@/components/labs/biomarker-timeline").then((m) => m.BiomarkerTimeline),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    ),
  }
);

const VitalsTimeline = dynamic(
  () => import("@/components/patients/vitals-timeline").then((m) => m.VitalsTimeline),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    ),
  }
);

const SymptomTimeline = dynamic(
  () => import("@/components/patients/symptom-timeline").then((m) => m.SymptomTimeline),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    ),
  }
);

const PatientTimeline = dynamic(
  () => import("@/components/patients/patient-timeline").then((m) => m.PatientTimeline),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    ),
  }
);

const FMTimeline = dynamic(
  () => import("@/components/patients/fm-timeline").then((m) => m.FMTimeline),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    ),
  }
);

const IFMMatrixView = dynamic(
  () => import("@/components/visits/ifm-matrix-view").then((m) => m.IFMMatrixView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    ),
  }
);

const VitalsSnapshot = dynamic(
  () => import("@/components/patients/vitals-snapshot").then((m) => m.VitalsSnapshot),
  { ssr: false }
);

type Tab = "overview" | "documents" | "prechart" | "ifm_matrix" | "visits" | "timeline" | "trends" | "fm_timeline" | "protocols";

interface DemoField {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: "email" | "tel" | "text";
  placeholder: string;
  format?: (v: string) => React.ReactNode;
}

const DEMO_FIELDS: DemoField[] = [
  { key: "email", label: "Email", icon: Mail, type: "email", placeholder: "patient@email.com", format: (v) => <a href={`mailto:${v}`} className="hover:text-[var(--color-brand-600)] transition-colors">{v}</a> },
  { key: "phone", label: "Phone", icon: Phone, type: "tel", placeholder: "(555) 555-1234", format: (v) => <a href={`tel:${v}`} className="hover:text-[var(--color-brand-600)] transition-colors">{v}</a> },
  { key: "address", label: "Address", icon: MapPin, placeholder: "Street address" },
  { key: "city", label: "City", icon: MapPin, placeholder: "City" },
  { key: "state", label: "State", icon: MapPin, placeholder: "State" },
  { key: "zip_code", label: "Zip", icon: MapPin, placeholder: "Zip code" },
  { key: "gender_identity", label: "Gender Identity", icon: Users, placeholder: "Gender identity" },
  { key: "ethnicity", label: "Ethnicity", icon: User, placeholder: "Ethnicity" },
  { key: "referral_source", label: "Referral Source", icon: ExternalLink, placeholder: "Referral source" },
];

function DemographicsCard({ patient, onSaved }: { patient: Patient; onSaved: (field: string, value: string | null) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  function startEdit() {
    const d: Record<string, string> = {};
    for (const f of DEMO_FIELDS) d[f.key] = (patient as unknown as Record<string, unknown>)[f.key] as string || "";
    setDraft(d);
    setIsEditing(true);
  }

  async function handleSave() {
    setIsSaving(true);
    // Build only changed fields
    const updates: Record<string, string | null> = {};
    for (const f of DEMO_FIELDS) {
      const current = ((patient as unknown as Record<string, unknown>)[f.key] as string) || "";
      const next = draft[f.key]?.trim() || "";
      if (current !== next) updates[f.key] = next || null;
    }
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      setIsSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      for (const [k, v] of Object.entries(updates)) onSaved(k, v);
      toast.success("Demographics updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save demographics");
    }
    setIsSaving(false);
  }

  return (
    <SectionShell
      title="Demographics & Contact"
      isEditing={isEditing}
      isSaving={isSaving}
      onEdit={startEdit}
      onSave={handleSave}
      onCancel={() => setIsEditing(false)}
    >
      {isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {DEMO_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{f.label}</label>
              <input
                type={f.type || "text"}
                value={draft[f.key] || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-text-primary)]/20"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {DEMO_FIELDS.map((f) => {
            const val = (patient as unknown as Record<string, unknown>)[f.key] as string | null;
            const Icon = f.icon;
            return (
              <div key={f.key} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Icon className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
                {val ? (f.format ? f.format(val) : <span>{val}</span>) : (
                  <span className="text-[var(--color-text-muted)] italic text-xs">No {f.label.toLowerCase()}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

interface VisitItem {
  id: string;
  visit_date: string;
  visit_type: string;
  status: string;
  chief_complaint: string | null;
  subjective: string | null;
  assessment: string | null;
}

export interface LabReportItem {
  id: string;
  raw_file_name: string | null;
  raw_file_size: number | null;
  lab_vendor: LabVendor;
  test_type: LabTestType;
  test_name: string | null;
  status: LabReportStatus;
  error_message: string | null;
  is_archived?: boolean;
  created_at: string;
  collection_date: string | null;
}

interface PatientProfileProps {
  patient: Patient;
  documents: Pick<PatientDocument, "id" | "file_name" | "file_size" | "document_type" | "title" | "status" | "error_message" | "uploaded_at" | "extracted_at">[];
  labReports: LabReportItem[];
  visits: VisitItem[];
  supplements: PatientSupplement[];
  initialTab?: Tab;
  subscriptionTier?: string;
  protocols?: { id: string; title: string; status: string; focus_areas: string[]; created_at: string; total_duration_weeks: number | null }[];
}

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

const EVIDENCE_COLORS: Record<string, string> = {
  meta_analysis: "bg-[var(--color-evidence-meta-bg)] text-[var(--color-evidence-meta-text)]",
  rct: "bg-blue-50 text-blue-700",
  clinical_guideline: "bg-emerald-50 text-emerald-700",
  cohort_study: "bg-purple-50 text-purple-700",
  case_study: "bg-gray-50 text-gray-600",
  expert_consensus: "bg-gray-50 text-gray-600",
};

const EVIDENCE_LABELS: Record<string, string> = {
  meta_analysis: "Meta-Analysis",
  rct: "RCT",
  clinical_guideline: "Guideline",
  cohort_study: "Cohort",
  case_study: "Case Study",
  expert_consensus: "Expert Consensus",
};

function RecommendationSection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ProtocolItem[] | null;
}) {
  const list = items && items.length > 0 ? items : null;

  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[var(--color-brand-600)]" />
        <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {list ? (
        <div className="space-y-2">
          {list.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {item.name}
                  </span>
                  {item.evidence_level && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${
                      EVIDENCE_COLORS[item.evidence_level] || EVIDENCE_COLORS.expert_consensus
                    }`}>
                      {EVIDENCE_LABELS[item.evidence_level] || item.evidence_level}
                    </span>
                  )}
                </div>
                {item.detail && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          No {title.toLowerCase()} yet
        </p>
      )}
    </div>
  );
}

// ── Re-populate intake banner ───────────────────────────────────────────

function RepopulateIntakeBanner({
  patient,
  documents,
  onRepopulated,
}: {
  patient: Patient;
  documents: Pick<PatientDocument, "document_type" | "status">[];
  onRepopulated: (data?: Partial<Patient>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Show if there's an intake form document but the patient has no intake-specific fields populated
  const hasIntakeDoc = documents.some((d) => d.document_type === "intake_form" && d.status === "extracted");
  const patientAny = patient as unknown as Record<string, unknown>;
  const hasIntakeData = Boolean(
    patientAny.diagnoses || patientAny.symptom_scores || patientAny.lifestyle ||
    patientAny.family_history_conditions || patientAny.surgeries || patientAny.prior_labs || patientAny.health_goals
  );

  if (!hasIntakeDoc || hasIntakeData || done) return null;

  async function handleRepopulate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/repopulate-intake`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Updated ${data.fields_updated?.length || 0} fields from intake`);
      setDone(true);
      onRepopulated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to re-populate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
      <div>
        <p className="text-xs font-medium text-amber-800">Intake form data available</p>
        <p className="text-[11px] text-amber-600 mt-0.5">Patient submitted an intake form but some fields weren&apos;t synced to their record.</p>
      </div>
      <button
        onClick={handleRepopulate}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 flex-shrink-0"
      >
        {loading ? "Syncing…" : "Sync Now"}
      </button>
    </div>
  );
}

// ── Intake-sourced overview sections ────────────────────────────────────

function IntakeShell({ title, icon, children, empty }: { title: string; icon?: React.ReactNode; children: React.ReactNode; empty?: boolean }) {
  if (empty) return null;
  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)]">
        {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
        <h3 className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function IntakeField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="block text-[11px] text-[var(--color-text-muted)] mb-0.5">{label}</span>
      <p className={`text-sm text-[var(--color-text-primary)] ${mono ? "font-[var(--font-mono)]" : ""}`}>{value}</p>
    </div>
  );
}

function DiagnosesSection({ diagnoses }: { diagnoses: string[] | null }) {
  if (!diagnoses || diagnoses.length === 0) return null;
  return (
    <IntakeShell title="Diagnoses">
      <div className="flex flex-wrap gap-1.5">
        {diagnoses.map((d, i) => (
          <span key={i} className="px-2.5 py-1 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-full">{d}</span>
        ))}
      </div>
    </IntakeShell>
  );
}

function SymptomScoresSection({ scores }: { scores: Record<string, number | undefined> | null }) {
  if (!scores) return null;
  const entries = Object.entries(scores).filter(([, v]) => v != null && v > 0).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0)) as [string, number][];
  if (entries.length === 0) return null;
  return (
    <IntakeShell title="Symptom Scores (patient-reported)">
      <div className="space-y-2">
        {entries.map(([name, score]) => (
          <div key={name} className="flex items-center gap-3">
            <span className="w-36 text-xs text-[var(--color-text-secondary)] capitalize truncate">{name.replace(/_/g, " ")}</span>
            <div className="flex-1 h-2 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${score * 10}%`,
                  backgroundColor: score >= 7 ? "var(--color-brand-800)" : score >= 4 ? "var(--color-brand-500)" : "var(--color-brand-300)",
                }}
              />
            </div>
            <span className="text-xs font-[var(--font-mono)] w-8 text-right text-[var(--color-text-muted)]">{score}/10</span>
          </div>
        ))}
      </div>
    </IntakeShell>
  );
}

const LIFESTYLE_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Substance Use", keys: ["alcohol", "tobacco", "cannabis", "caffeine"] },
  { label: "Diet & Nutrition", keys: ["diet_type", "meals_per_day", "sugar_intake", "water_intake", "skip_breakfast", "food_triggers"] },
  { label: "Sleep", keys: ["sleep_hours", "sleep_bedtime"] },
  { label: "Exercise", keys: ["exercise_freq", "exercise_type", "exercise_tolerance"] },
  { label: "Stress & Environment", keys: ["stress_level", "stressors", "env_exposures"] },
];

function formatLifestyleLabel(key: string): string {
  const labels: Record<string, string> = {
    alcohol: "Alcohol", tobacco: "Tobacco", cannabis: "Cannabis", caffeine: "Caffeine",
    diet_type: "Diet", meals_per_day: "Meals/Day", sugar_intake: "Sugar (1-10)", water_intake: "Water (oz)",
    skip_breakfast: "Skips Breakfast", food_triggers: "Food Triggers",
    sleep_hours: "Hours", sleep_bedtime: "Bedtime",
    exercise_freq: "Frequency", exercise_type: "Type", exercise_tolerance: "Tolerance",
    stress_level: "Level (1-10)", stressors: "Stressors", env_exposures: "Exposures",
  };
  return labels[key] || key.replace(/_/g, " ");
}

function LifestyleSection({ lifestyle }: { lifestyle: Record<string, unknown> | null }) {
  if (!lifestyle) return null;
  const allEntries = Object.entries(lifestyle).filter(([, v]) => v != null && v !== "");
  if (allEntries.length === 0) return null;

  const entryMap = new Map(allEntries);
  const renderedKeys = new Set<string>();

  function renderGroup(label: string, keys: string[]) {
    const items = keys.filter((k) => entryMap.has(k));
    if (items.length === 0) return null;
    items.forEach((k) => renderedKeys.add(k));
    return (
      <div key={label} className="rounded-lg border border-[var(--color-border-light)] overflow-hidden">
        <div className="px-3 py-1.5 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)]">
          <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{label}</p>
        </div>
        <div className="px-3 py-2.5 grid grid-cols-2 gap-x-8 gap-y-2.5">
          {items.map((key) => (
            <IntakeField
              key={key}
              label={formatLifestyleLabel(key)}
              value={Array.isArray(entryMap.get(key)) ? (entryMap.get(key) as string[]).join(", ") : String(entryMap.get(key))}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <IntakeShell title="Lifestyle">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LIFESTYLE_GROUPS.map((group) => renderGroup(group.label, group.keys))}
        {/* Ungrouped entries */}
        {allEntries.filter(([k]) => !renderedKeys.has(k)).length > 0 &&
          renderGroup("Other", allEntries.filter(([k]) => !renderedKeys.has(k)).map(([k]) => k))
        }
      </div>
    </IntakeShell>
  );
}

function FamilyHistorySection({ conditions, detail }: { conditions: string[] | null; detail: string | null }) {
  if ((!conditions || conditions.length === 0) && !detail) return null;
  return (
    <IntakeShell title="Family History">
      {conditions && conditions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {conditions.map((c, i) => (
            <span key={i} className="px-2.5 py-1 text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-full text-[var(--color-text-secondary)]">{c}</span>
          ))}
        </div>
      )}
      {detail && <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{detail}</p>}
    </IntakeShell>
  );
}

function GeneticsSection({ genetic_testing, apoe_genotype, mthfr_variants }: { genetic_testing: string | null; apoe_genotype: string | null; mthfr_variants: string | null }) {
  if (!genetic_testing && !apoe_genotype && !mthfr_variants) return null;
  return (
    <IntakeShell title="Genetics">
      <div className="grid grid-cols-3 gap-x-6 gap-y-2.5">
        {genetic_testing && <IntakeField label="Testing Done" value={genetic_testing} />}
        {apoe_genotype && <IntakeField label="APOE Genotype" value={apoe_genotype} mono />}
        {mthfr_variants && <IntakeField label="MTHFR Variants" value={mthfr_variants} mono />}
      </div>
    </IntakeShell>
  );
}

function SurgeriesSection({ surgeries }: { surgeries: Array<{name: string; year: string}> | null }) {
  if (!surgeries || surgeries.length === 0) return null;
  return (
    <IntakeShell title="Surgeries / Hospitalizations">
      <div className="space-y-1.5">
        {surgeries.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-primary)]">{s.name}</span>
            {s.year && <span className="text-xs text-[var(--color-text-muted)]">({s.year})</span>}
          </div>
        ))}
      </div>
    </IntakeShell>
  );
}

function PriorLabsSection({ priorLabs }: { priorLabs: string[] | null }) {
  if (!priorLabs || priorLabs.length === 0) return null;
  return (
    <IntakeShell title="Prior Labs (patient-reported)">
      <div className="flex flex-wrap gap-1.5">
        {priorLabs.map((lab, i) => (
          <span key={i} className="px-2.5 py-1 text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-full text-[var(--color-text-secondary)]">{lab}</span>
        ))}
      </div>
    </IntakeShell>
  );
}

function HealthGoalsSection({ goals }: { goals: string | null }) {
  if (!goals) return null;
  return (
    <IntakeShell title="Health Goals">
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{goals}</p>
    </IntakeShell>
  );
}

export function PatientProfile({ patient: initialPatient, documents: initialDocs, labReports: initialLabs, visits, supplements: initialSupplements, initialTab = "overview", subscriptionTier, protocols }: PatientProfileProps) {
  const router = useRouter();
  const [patient, setPatient] = useState(initialPatient);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [documents, setDocuments] = useState(initialDocs);
  const [labReports, setLabReports] = useState(initialLabs);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [initialBiomarkerCode, setInitialBiomarkerCode] = useState<string | null>(null);
  const [trendsView, setTrendsView] = useState<"biomarkers" | "vitals" | "symptoms">("biomarkers");
  const [fmTimelineData, setFmTimelineData] = useState<FMTimelineData | null>(
    initialPatient.fm_timeline_data ?? null
  );

  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);

  // Archive / Delete state
  const [showMenu, setShowMenu] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const extractedDocCount = documents.filter((d) => d.status === "extracted").length;

  const handleFieldSaved = useCallback((field: string, value: unknown) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePopulated = useCallback((data?: Partial<Patient>) => {
    if (data) setPatient((prev) => ({ ...prev, ...data }));
  }, []);

  const handleMatrixUpdate = useCallback(async (matrix: import("@/types/database").IFMMatrix) => {
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ifm_matrix: matrix }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setPatient((prev) => ({ ...prev, ifm_matrix: matrix }));
    } catch {
      // Could add toast — silently fail for now
    }
  }, [patient.id]);

  const handlePushToFMTimeline = useCallback(async (
    event: TimelineEvent,
    category: FMCategory,
    lifeStage: FMLifeStage
  ) => {
    const year = new Date(event.event_date).getFullYear();
    const res = await fetch(`/api/patients/${patient.id}/fm-timeline/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        life_stage: lifeStage,
        title: event.title,
        notes: event.summary ?? undefined,
        year,
        source: "practitioner",
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Failed to push event");
    }
    const data = await res.json();
    setFmTimelineData(data.fm_timeline_data);
  }, [patient.id]);

  const handleArchiveToggle = async () => {
    const newArchived = !patient.is_archived;
    setArchiving(true);
    try {
      if (newArchived) {
        // Archive via DELETE endpoint
        const res = await fetch(`/api/patients/${patient.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to archive");
      } else {
        // Restore via PATCH
        const res = await fetch(`/api/patients/${patient.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_archived: false }),
        });
        if (!res.ok) throw new Error("Failed to restore");
      }
      setPatient((prev) => ({ ...prev, is_archived: newArchived }));
      setShowArchiveDialog(false);
      setShowMenu(false);
    } catch {
      // silently fail — could add toast
    } finally {
      setArchiving(false);
    }
  };

  const handlePermanentDelete = async (confirmation: string) => {
    const res = await fetch(`/api/patients/${patient.id}/permanent-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete");
    }
    router.push("/patients");
  };

  const name = [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "Unnamed Patient";
  const age = getAge(patient.date_of_birth);

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "overview", label: "Overview", icon: User },
    { key: "documents", label: `Documents (${documents.length + labReports.length})`, icon: FileText },
    { key: "trends", label: "Trends", icon: TrendingUp },
    { key: "prechart", label: "Pre-Chart", icon: ClipboardList },
    { key: "ifm_matrix", label: "IFM", icon: Grid3x3 },
    { key: "visits", label: `Visits (${visits.length})`, icon: Stethoscope },
    { key: "timeline", label: "Timeline", icon: Clock },
    { key: "fm_timeline", label: "FM Timeline", icon: GitBranch },
    { key: "protocols", label: "Protocols", icon: FlaskConical },
  ];

  const handleDocumentUploaded = (newDoc: typeof documents[0]) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDocumentDeleted = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleDocumentRenamed = (docId: string, newTitle: string) => {
    setDocuments((prev) => prev.map((d) => d.id === docId ? { ...d, title: newTitle } : d));
  };

  const handleDocumentTypeChanged = (docId: string, newType: string) => {
    setDocuments((prev) => prev.map((d) => d.id === docId ? { ...d, document_type: newType as DocumentType } : d));
  };

  const handleParseAsLab = async (docId: string) => {
    try {
      const res = await fetch(`/api/patients/${patient.id}/documents/${docId}/parse-as-lab`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start lab parsing");
      }
      const { labReport, existing } = await res.json();
      if (existing) {
        toast.info("Lab report already exists — opening results");
        setSelectedLabId(labReport.id);
      } else {
        setLabReports((prev) => [labReport, ...prev]);
        // Remove the source document from the list — the lab report replaces it
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        toast.success("Lab parsing started");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse as lab");
    }
  };

  const handleLabDeleted = (labId: string) => {
    setLabReports((prev) => prev.filter((l) => l.id !== labId));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-4">
        <Link
          href="/patients"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Patients
        </Link>
        <span className="text-[var(--color-text-muted)]">&gt;</span>
        <span className="text-[var(--color-text-primary)]">{name}</span>
      </nav>

      {/* Archived banner */}
      {patient.is_archived && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 mb-4 rounded-[var(--radius-md)] border border-[var(--color-warning-200)] bg-[var(--color-warning-50)]">
          <div className="flex items-center gap-2 text-sm text-[var(--color-warning-700)]">
            <Archive className="w-4 h-4" />
            <span className="font-medium">This patient has been archived.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleArchiveToggle}
              disabled={archiving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-warning-700)] bg-[var(--color-warning-100)] hover:bg-[var(--color-warning-200)] rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
              {archiving ? "Restoring..." : "Restore"}
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-destructive-600)] bg-[var(--color-destructive-50)] hover:bg-[var(--color-destructive-100)] rounded-[var(--radius-md)] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Permanently Delete
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center">
            <User className="w-5 h-5 text-[var(--color-brand-600)]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{name}</h1>
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
              {age !== null && <span>{age} years old</span>}
              {patient.sex && <span className="capitalize">{patient.sex}</span>}
              {patient.date_of_birth && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!patient.is_archived && (
            <InviteToPortalButton
              patientId={patient.id}
              patientEmail={patient.email}
              portalStatus={patient.portal_status}
            />
          )}
          {!patient.is_archived && (
            <CreateVisitButton
              patientId={patient.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              New Visit
            </CreateVisitButton>
          )}

          {/* Actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
              title="Patient actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                {/* Click-away backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] z-20 py-1">
                  {!patient.is_archived ? (
                    <button
                      onClick={() => { setShowMenu(false); setShowArchiveDialog(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Archive Patient
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => { setShowMenu(false); handleArchiveToggle(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                        Restore Patient
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); setShowDeleteDialog(true); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-destructive-600)] hover:bg-[var(--color-destructive-50)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Permanently Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Archive confirmation dialog */}
      {showArchiveDialog && (
        <ConfirmDialog
          title="Archive Patient"
          description={`Are you sure you want to archive ${name}? They will no longer appear in your active patient list but can be restored later.`}
          confirmLabel={archiving ? "Archiving..." : "Archive"}
          confirmVariant="warning"
          disabled={archiving}
          onConfirm={handleArchiveToggle}
          onCancel={() => setShowArchiveDialog(false)}
        />
      )}

      {/* Permanent delete dialog */}
      {showDeleteDialog && (
        <PermanentDeleteDialog
          patientName={name}
          onConfirm={handlePermanentDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      {/* Tab bar — dropdown on mobile, scrollable row on desktop */}
      <div className="mb-6">
        {/* Mobile: dropdown select */}
        <div className="md:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as Tab)}
            className="w-full px-4 py-3 text-sm font-medium border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-400)] appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b8a83' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
          >
            {tabs.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        {/* Desktop: single scrollable row */}
        <div className="hidden md:block relative">
          <div className="flex items-center gap-1 border-b border-[var(--color-border-light)] overflow-x-auto -mb-px" style={{ scrollbarWidth: "thin" }}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === key
                    ? "border-[var(--color-brand-600)] text-[var(--color-brand-700)]"
                    : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <PopulateFromDocsBanner
              patient={patient}
              extractedDocCount={extractedDocCount}
              onPopulated={handlePopulated}
            />
            <RepopulateIntakeBanner
              patient={patient}
              documents={documents}
              onRepopulated={handlePopulated}
            />
            {/* Demographics */}
            <DemographicsCard patient={patient} onSaved={handleFieldSaved} />
            {protocols && protocols.length > 0 && (
              <ActiveProtocolCard patientId={patient.id} protocols={protocols} />
            )}
            <VitalsSnapshot
              patientId={patient.id}
              onViewTrends={() => {
                setTrendsView("vitals");
                setActiveTab("trends");
              }}
            />
            <EditableTagSection
              title="Chief Complaints"
              values={patient.chief_complaints}
              patientId={patient.id}
              fieldName="chief_complaints"
              onSaved={handleFieldSaved}
            />
            <EditableTextSection
              title="Medical History"
              value={patient.medical_history}
              patientId={patient.id}
              fieldName="medical_history"
              onSaved={handleFieldSaved}
            />
            <MedicationList patientId={patient.id} />
            <SupplementList
              patientId={patient.id}
              initialSupplements={initialSupplements}
            />
            <RecommendationSection
              title="Dietary Recommendations"
              icon={Salad}
              items={patient.dietary_recommendations}
            />
            <RecommendationSection
              title="Lifestyle Recommendations"
              icon={HeartPulse}
              items={patient.lifestyle_recommendations}
            />
            <RecommendationSection
              title="Follow-up Labs"
              icon={FlaskConical}
              items={patient.follow_up_labs}
            />
            <EditableTagSection
              title="Allergies"
              values={patient.allergies}
              patientId={patient.id}
              fieldName="allergies"
              onSaved={handleFieldSaved}
              tagColor="red"
            />
            {/* Intake-sourced sections */}
            <DiagnosesSection diagnoses={patient.diagnoses} />
            <SymptomScoresSection scores={patient.symptom_scores} />
            <LifestyleSection lifestyle={patient.lifestyle} />
            <FamilyHistorySection
              conditions={patient.family_history_conditions}
              detail={patient.family_history_detail}
            />
            <GeneticsSection
              genetic_testing={patient.genetic_testing}
              apoe_genotype={patient.apoe_genotype}
              mthfr_variants={patient.mthfr_variants}
            />
            <SurgeriesSection surgeries={patient.surgeries} />
            <PriorLabsSection priorLabs={patient.prior_labs} />
            <HealthGoalsSection goals={patient.health_goals} />
            <EditableTextSection
              title="Notes"
              value={patient.notes}
              patientId={patient.id}
              fieldName="notes"
              onSaved={handleFieldSaved}
            />
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <DocumentUpload patientId={patient.id} onUploaded={handleDocumentUploaded} />
            <DocumentList
              patientId={patient.id}
              documents={documents}
              labReports={labReports}
              onDeleted={handleDocumentDeleted}
              onRenamed={handleDocumentRenamed}
              onTypeChanged={handleDocumentTypeChanged}
              onParseAsLab={handleParseAsLab}
              onLabDeleted={handleLabDeleted}
              onLabClick={setSelectedLabId}
              onDocClick={setSelectedDocId}
              groupBy
            />
          </div>
        )}

        {activeTab === "trends" && (
          <div>
            {/* Sub-toggle: Biomarkers / Vitals & Pillars / Symptoms */}
            <div className="flex items-center gap-1 mb-5">
              {(["biomarkers", "vitals", "symptoms"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setTrendsView(v);
                    if (v !== "biomarkers") setInitialBiomarkerCode(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    trendsView === v
                      ? "bg-[var(--color-brand-600)] text-white"
                      : "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {v === "biomarkers" ? "Biomarkers" : v === "vitals" ? "Vitals & Pillars" : "Symptoms"}
                </button>
              ))}
            </div>
            {trendsView === "biomarkers" ? (
              <BiomarkerTimeline
                patientId={patient.id}
                initialBiomarkerCode={initialBiomarkerCode ?? undefined}
              />
            ) : trendsView === "vitals" ? (
              <VitalsTimeline patientId={patient.id} />
            ) : (
              <SymptomTimeline patientId={patient.id} />
            )}
          </div>
        )}

        {activeTab === "prechart" && (
          <PreChartView
            patient={patient}
            documentCount={documents.length + labReports.length}
            onResynthesized={() => router.refresh()}
          />
        )}

        {activeTab === "ifm_matrix" && (
          <div className="space-y-4">
            <PopulateFromDocsBanner
              patient={patient}
              extractedDocCount={extractedDocCount}
              sectionsFilter={["ifm_matrix"]}
              onPopulated={handlePopulated}
            />
            <IFMMatrixView
              matrix={patient.ifm_matrix}
              status="complete"
              readOnly={false}
              onUpdate={handleMatrixUpdate}
            />
          </div>
        )}

        {activeTab === "visits" && (
          <div className="space-y-2">
            {visits.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-text-muted)] py-8">
                No visits linked to this patient
              </p>
            ) : (
              visits.map((visit) => {
                const hasSoap = !!(visit.subjective || visit.assessment);
                const isExpanded = expandedVisitId === visit.id;

                return (
                  <div
                    key={visit.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border-light)] overflow-hidden transition-colors"
                  >
                    {/* Visit header row */}
                    <button
                      onClick={() => {
                        if (hasSoap) setExpandedVisitId(isExpanded ? null : visit.id);
                      }}
                      className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                        hasSoap ? "hover:bg-[var(--color-surface-secondary)] cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Stethoscope className="w-4 h-4 text-[var(--color-brand-600)] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                            {visit.chief_complaint || "Visit"}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {new Date(visit.visit_date).toLocaleDateString()} &middot; {visit.visit_type === "follow_up" ? "Follow-up" : "SOAP"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          visit.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {visit.status === "completed" ? "Completed" : "Draft"}
                        </span>
                        {hasSoap && (
                          <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </button>

                    {/* Expanded SOAP summary */}
                    {isExpanded && hasSoap && (
                      <div className="px-4 pb-3 pt-0 border-t border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
                        <div className="space-y-2.5 pt-3">
                          {visit.subjective && (
                            <div>
                              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">Subjective</p>
                              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">{visit.subjective}</p>
                            </div>
                          )}
                          {visit.assessment && (
                            <div>
                              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">Assessment</p>
                              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">{visit.assessment}</p>
                            </div>
                          )}
                          <Link
                            href={`/visits/${visit.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors pt-1"
                          >
                            Open full note
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <PatientTimeline
            patientId={patient.id}
            onPushToFMTimeline={handlePushToFMTimeline}
          />
        )}

        {activeTab === "fm_timeline" && (
          <FMTimeline
            patientId={patient.id}
            initialData={fmTimelineData}
            onDataChange={setFmTimelineData}
          />
        )}

        {activeTab === "protocols" && (
          <div className="space-y-4">
            <GenerateProtocolButton
              patientId={patient.id}
              patientName={name}
              tier={(subscriptionTier || "free") as import("@/lib/tier/gates").SubscriptionTier}
            />
            <ProtocolList
              protocols={(protocols || []).map(p => ({ ...p, patient_id: patient.id, practitioner_id: "", generation_context: {}, started_at: null, completed_at: null, updated_at: p.created_at })) as import("@/types/protocol").ProtocolListItem[]}
              patientId={patient.id}
            />
          </div>
        )}
      </div>

      {/* Document detail slide-over */}
      <DocumentDetailSheet
        documentId={selectedDocId}
        patientId={patient.id}
        patientName={name}
        onClose={() => setSelectedDocId(null)}
        onRetried={() => {
          // Update the document status optimistically
          setDocuments((prev) => prev.map((d) =>
            d.id === selectedDocId ? { ...d, status: "extracting" as const, error_message: null } : d
          ));
        }}
      />

      {/* Lab detail slide-over — opens when clicking a lab in the Documents tab */}
      <LabDetailSheet
        labId={selectedLabId}
        patientId={patient.id}
        patientName={name}
        onClose={() => setSelectedLabId(null)}
        onOpenTrends={(code) => {
          setSelectedLabId(null);
          setInitialBiomarkerCode(code ?? null);
          setActiveTab("trends");
        }}
      />
    </div>
  );
}

// ── Dialogs ─────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant = "warning",
  disabled,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "warning" | "danger";
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const variantStyles = {
    warning: "bg-[var(--color-warning-600)] hover:bg-[var(--color-warning-700)] text-white",
    danger: "bg-[var(--color-destructive-600)] hover:bg-[var(--color-destructive-700)] text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/20" onClick={onCancel} />
      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-elevated)] border border-[var(--color-border)] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">{description}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors disabled:opacity-50 ${variantStyles[confirmVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PermanentDeleteDialog({
  patientName,
  onConfirm,
  onCancel,
}: {
  patientName: string;
  onConfirm: (confirmation: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const expected = `${patientName} Delete`;
  const isMatch = input === expected;

  const handleSubmit = async () => {
    if (!isMatch) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/20" onClick={onCancel} />
      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--color-border)] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--color-destructive-50)] border border-[var(--color-destructive-200)] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[var(--color-destructive-500)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Permanently Delete Patient</h2>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] mb-2 leading-relaxed">
          This action is <strong className="text-[var(--color-destructive-600)]">irreversible</strong>. All patient data including visits, documents, lab reports, and supplements will be permanently deleted.
        </p>

        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          To confirm, type <strong className="text-[var(--color-text-primary)] font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">{expected}</strong> below:
        </p>

        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          placeholder={expected}
          className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-destructive-200)] focus:border-[var(--color-destructive-300)] placeholder:text-[var(--color-text-muted)]"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />

        {error && <p className="text-xs text-[var(--color-destructive-600)] mt-2">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isMatch || deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-destructive-600)] hover:bg-[var(--color-destructive-700)] rounded-[var(--radius-md)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Permanently Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
