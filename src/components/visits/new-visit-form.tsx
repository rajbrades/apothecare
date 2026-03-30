"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, FileText, ChevronDown, User, Stethoscope,
  ClipboardList, HeartPulse, UserCheck, Plus, Circle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { VisitType } from "@/lib/validations/visit";
import { PatientQuickCreate } from "@/components/patients/patient-quick-create";
import { cn } from "@/lib/utils";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const ENCOUNTER_TYPES: { value: VisitType; label: string; icon: typeof ClipboardList }[] = [
  { value: "soap", label: "SOAP Note", icon: ClipboardList },
  { value: "follow_up", label: "Follow-up", icon: Stethoscope },
  { value: "history_physical", label: "History & Physical", icon: HeartPulse },
  { value: "consult", label: "Consult Note", icon: UserCheck },
];

export function NewVisitForm({ patients: initialPatients }: { patients: PatientOption[] }) {
  const router = useRouter();
  const [visitType, setVisitType] = useState<VisitType>("soap");
  const [patientId, setPatientId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>(initialPatients);

  const selectedType = ENCOUNTER_TYPES.find((t) => t.value === visitType)!;

  const createAndNavigate = async (autoTranscribe: boolean) => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_type: visitType,
          patient_id: patientId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create visit");
      }

      const { visit } = await res.json();
      router.push(`/visits/${visit.id}${autoTranscribe ? "?mode=transcribe" : ""}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const handlePatientCreated = (patient: { id: string; first_name: string | null; last_name: string | null }) => {
    setPatients((prev) => [...prev, patient]);
    setPatientId(patient.id);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
          New Visit
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
          Apothecare captures your visit and generates a structured clinical note with IFM mapping and protocol recommendations.
        </p>
      </div>

      {/* Encounter type + Patient row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        {/* Encounter type dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[220px] justify-between font-normal"
            >
              <div className="flex items-center gap-2">
                <selectedType.icon className="w-4 h-4 text-[var(--color-brand-600)]" />
                {selectedType.label}
              </div>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(220px,90vw)]">
            {ENCOUNTER_TYPES.map((type) => (
              <DropdownMenuItem
                key={type.value}
                onClick={() => setVisitType(type.value)}
                className={cn(
                  "gap-2",
                  visitType === type.value && "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                )}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Patient selector + New Patient button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] outline-none text-[var(--color-text-primary)] focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all appearance-none min-w-[200px]"
            >
              <option value="">No patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            onClick={() => setShowNewPatient(true)}
            variant="outline"
            className="border-[var(--color-brand-200)] text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] gap-1.5"
            title="Create new patient"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>
      </div>

      {/* Action buttons — Transcribe + Type Notes */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={() => createAndNavigate(true)}
          disabled={submitting}
          size="lg"
          className="gap-2.5 rounded-full px-8"
        >
          <Sparkles className="w-5 h-5" />
          AI Scribe
        </Button>
        <Button
          onClick={() => createAndNavigate(false)}
          disabled={submitting}
          variant="secondary"
          size="lg"
          className="gap-2.5 rounded-full px-8"
        >
          <FileText className="w-5 h-5" />
          Type Notes
        </Button>
      </div>

      {/* Patient context hint */}
      {patientId && (
        <p className="text-xs text-[var(--color-brand-600)] mb-4">
          Patient history, documents, and pre-chart data will be included as AI context.
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)] max-w-md">
          {error}
        </div>
      )}

      {/* Back link */}
      <Link
        href="/visits"
        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mt-2"
      >
        Back to visits
      </Link>

      {/* Patient quick-create modal */}
      <PatientQuickCreate
        open={showNewPatient}
        onClose={() => setShowNewPatient(false)}
        onCreated={handlePatientCreated}
      />
    </div>
  );
}
