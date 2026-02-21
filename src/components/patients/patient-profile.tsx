"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  User, Calendar, FileText, ClipboardList,
  Stethoscope, Upload, FlaskConical, Loader2, Clock,
  Pencil, Check, X, Plus,
} from "lucide-react";
import { DocumentUpload } from "./document-upload";
import { DocumentList } from "./document-list";
import { PreChartView } from "./pre-chart-view";
import { LabReportCard } from "@/components/labs/lab-report-card";
import { SupplementList } from "./supplement-list";
import type { Patient, PatientDocument, PatientSupplement } from "@/types/database";
import type { LabReportStatus, LabVendor, LabTestType } from "@/types/database";

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

type Tab = "overview" | "documents" | "labs" | "prechart" | "visits" | "timeline";

interface VisitItem {
  id: string;
  visit_date: string;
  visit_type: string;
  status: string;
  chief_complaint: string | null;
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
}

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function PatientProfile({ patient: initialPatient, documents: initialDocs, labReports: initialLabs, visits, supplements: initialSupplements }: PatientProfileProps) {
  const [patient, setPatient] = useState(initialPatient);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [labView, setLabView] = useState<"reports" | "trends">("reports");
  const [documents, setDocuments] = useState(initialDocs);
  const [labReports, setLabReports] = useState(initialLabs);

  const handleFieldSaved = useCallback((field: string, value: unknown) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  }, []);

  const name = [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "Unnamed Patient";
  const age = getAge(patient.date_of_birth);

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "overview", label: "Overview", icon: User },
    { key: "documents", label: `Documents (${documents.length})`, icon: FileText },
    { key: "labs", label: `Labs (${labReports.length})`, icon: FlaskConical },
    { key: "prechart", label: "Pre-Chart", icon: ClipboardList },
    { key: "visits", label: `Visits (${visits.length})`, icon: Stethoscope },
    { key: "timeline", label: "Timeline", icon: Clock },
  ];

  const handleDocumentUploaded = (newDoc: typeof documents[0]) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDocumentDeleted = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
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

      <div className="flex items-start justify-between mb-6">
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

        <Link
          href={`/visits/new?patient_id=${patient.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors"
        >
          <Stethoscope className="w-3.5 h-3.5" />
          New Visit
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--color-border-light)]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key
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
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-4">
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
            <EditableTextSection
              title="Current Medications"
              value={patient.current_medications}
              patientId={patient.id}
              fieldName="current_medications"
              onSaved={handleFieldSaved}
            />
            <SupplementList
              patientId={patient.id}
              initialSupplements={initialSupplements}
            />
            <EditableTagSection
              title="Allergies"
              values={patient.allergies}
              patientId={patient.id}
              fieldName="allergies"
              onSaved={handleFieldSaved}
              tagColor="red"
            />
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
              onLabDeleted={handleLabDeleted}
            />
          </div>
        )}

        {activeTab === "labs" && (
          <div className="space-y-4">
            {/* Sub-view toggle: Reports / Trends */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-0.5 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
                <button
                  onClick={() => setLabView("reports")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                    labView === "reports"
                      ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  Reports ({labReports.length})
                </button>
                <button
                  onClick={() => setLabView("trends")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                    labView === "trends"
                      ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  Trends
                </button>
              </div>
              {labView === "reports" && (
                <Link
                  href={`/labs?patient_id=${patient.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Lab
                </Link>
              )}
            </div>

            {labView === "reports" && (
              <>
                {labReports.length === 0 ? (
                  <p className="text-center text-sm text-[var(--color-text-muted)] py-8">
                    No lab reports for this patient yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {labReports.map((lab) => (
                      <LabReportCard
                        key={lab.id}
                        report={lab}
                        onDelete={handleLabDeleted}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {labView === "trends" && (
              <BiomarkerTimeline patientId={patient.id} />
            )}
          </div>
        )}

        {activeTab === "prechart" && (
          <PreChartView patient={patient} />
        )}

        {activeTab === "visits" && (
          <div className="space-y-2">
            {visits.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-text-muted)] py-8">
                No visits linked to this patient
              </p>
            ) : (
              visits.map((visit) => (
                <Link
                  key={visit.id}
                  href={`/visits/${visit.id}`}
                  className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-4 h-4 text-[var(--color-brand-600)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {visit.chief_complaint || "Visit"}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {new Date(visit.visit_date).toLocaleDateString()} &middot; {visit.visit_type === "follow_up" ? "Follow-up" : "SOAP"}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    visit.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {visit.status === "completed" ? "Completed" : "Draft"}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <PatientTimeline patientId={patient.id} />
        )}
      </div>
    </div>
  );
}

// ── Editable Section Primitives ──────────────────────────────────────

function SectionShell({
  title,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  children,
}: {
  title: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          {title}
        </h3>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="p-1 rounded-[var(--radius-sm)] text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] transition-colors"
              title="Save"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            title={`Edit ${title.toLowerCase()}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="text-[var(--color-text-primary)]">{children}</div>
    </div>
  );
}

function EditableTextSection({
  title,
  value,
  patientId,
  fieldName,
  onSaved,
}: {
  title: string;
  value: string | null;
  patientId: string;
  fieldName: string;
  onSaved: (field: string, value: string | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setDraft(value ?? "");
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    const newValue = trimmed || null;
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: newValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      onSaved(fieldName, newValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionShell
      title={title}
      isEditing={isEditing}
      isSaving={isSaving}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] p-2 bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] resize-y"
            autoFocus
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </>
      ) : value ? (
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      ) : (
        <button
          onClick={handleEdit}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {title.toLowerCase()}
        </button>
      )}
    </SectionShell>
  );
}

function EditableTagSection({
  title,
  values,
  patientId,
  fieldName,
  onSaved,
  tagColor = "brand",
}: {
  title: string;
  values: string[] | null;
  patientId: string;
  fieldName: string;
  onSaved: (field: string, value: string[] | null) => void;
  tagColor?: "brand" | "red";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<string[]>(values ?? []);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const colorMap = {
    brand: { bg: "bg-[var(--color-brand-50)]", text: "text-[var(--color-brand-700)]" },
    red: { bg: "bg-red-50", text: "text-red-700" },
  };
  const colors = colorMap[tagColor];

  const handleEdit = () => {
    setDraft(values ?? []);
    setInputValue("");
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !draft.includes(trimmed)) {
      setDraft((prev) => [...prev, trimmed]);
    }
    setInputValue("");
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    setDraft((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && inputValue === "" && draft.length > 0) {
      setDraft((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    const newValue = draft.length > 0 ? draft : null;
    const unchanged =
      (newValue === null && (values === null || values.length === 0)) ||
      (newValue !== null && values !== null && JSON.stringify(newValue) === JSON.stringify(values));

    if (unchanged) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: newValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      onSaved(fieldName, newValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionShell
      title={title}
      isEditing={isEditing}
      isSaving={isSaving}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {draft.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs ${colors.bg} ${colors.text} rounded-full`}
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:opacity-70"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Add ${title.toLowerCase().replace(/s$/, "")}...`}
              className="flex-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
              autoFocus
            />
            <button
              onClick={addTag}
              disabled={!inputValue.trim()}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] transition-colors disabled:opacity-30"
              type="button"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </>
      ) : values && values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs ${colors.bg} ${colors.text} rounded-full`}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <button
          onClick={handleEdit}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {title.toLowerCase()}
        </button>
      )}
    </SectionShell>
  );
}
