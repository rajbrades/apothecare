"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  User, Calendar, FileText, ClipboardList,
  Stethoscope, Upload, FlaskConical, Loader2, Clock,
} from "lucide-react";
import { DocumentUpload } from "./document-upload";
import { DocumentList } from "./document-list";
import { PreChartView } from "./pre-chart-view";
import { LabReportCard } from "@/components/labs/lab-report-card";
import type { Patient, PatientDocument } from "@/types/database";
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
}

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function PatientProfile({ patient, documents: initialDocs, labReports: initialLabs, visits }: PatientProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [labView, setLabView] = useState<"reports" | "trends">("reports");
  const [documents, setDocuments] = useState(initialDocs);
  const [labReports, setLabReports] = useState(initialLabs);

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
            {patient.chief_complaints?.length ? (
              <Section title="Chief Complaints">
                <div className="flex flex-wrap gap-1.5">
                  {patient.chief_complaints.map((cc) => (
                    <span key={cc} className="px-2 py-0.5 text-xs bg-[var(--color-brand-50)] text-[var(--color-brand-700)] rounded-full">
                      {cc}
                    </span>
                  ))}
                </div>
              </Section>
            ) : null}
            {patient.medical_history && <Section title="Medical History"><p className="text-sm whitespace-pre-wrap">{patient.medical_history}</p></Section>}
            {patient.current_medications && <Section title="Current Medications"><p className="text-sm whitespace-pre-wrap">{patient.current_medications}</p></Section>}
            {patient.supplements && <Section title="Current Supplements"><p className="text-sm whitespace-pre-wrap">{patient.supplements}</p></Section>}
            {patient.allergies?.length ? (
              <Section title="Allergies">
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies.map((a) => (
                    <span key={a} className="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded-full">{a}</span>
                  ))}
                </div>
              </Section>
            ) : null}
            {patient.notes && <Section title="Notes"><p className="text-sm whitespace-pre-wrap">{patient.notes}</p></Section>}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
      <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-[var(--color-text-primary)]">{children}</div>
    </div>
  );
}
