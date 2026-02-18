"use client";

import { useState } from "react";
import { useInteractionCheck } from "@/hooks/use-interaction-check";
import { InteractionResultCard } from "./interaction-result-card";
import { Loader2, Shield, AlertTriangle, StopCircle } from "lucide-react";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  supplements: string | null;
  current_medications: string | null;
}

interface InteractionCheckerProps {
  patients: PatientOption[];
}

export function InteractionChecker({ patients }: InteractionCheckerProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [supplements, setSupplements] = useState("");
  const [medications, setMedications] = useState("");

  const { status, rawText, checkData, error, runCheck, abort } =
    useInteractionCheck();

  const isChecking = status === "generating" || status === "streaming";

  // Auto-fill from patient record
  function handlePatientChange(patientId: string) {
    setSelectedPatientId(patientId);
    if (patientId) {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        setSupplements(patient.supplements || "");
        setMedications(patient.current_medications || "");
      }
    }
  }

  function handleCheck() {
    if (!supplements.trim()) return;
    runCheck(
      supplements.trim(),
      medications.trim(),
      selectedPatientId || null
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient selector (optional) */}
      <div>
        <label
          htmlFor="interaction-patient"
          className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
        >
          Auto-fill from patient (optional)
        </label>
        <select
          id="interaction-patient"
          value={selectedPatientId}
          onChange={(e) => handlePatientChange(e.target.value)}
          disabled={isChecking}
          className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent disabled:opacity-50"
        >
          <option value="">Select a patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {[p.first_name, p.last_name].filter(Boolean).join(" ") ||
                "Unnamed Patient"}
            </option>
          ))}
        </select>
      </div>

      {/* Supplements textarea */}
      <div>
        <label
          htmlFor="interaction-supplements"
          className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
        >
          Supplements
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <textarea
          id="interaction-supplements"
          value={supplements}
          onChange={(e) => setSupplements(e.target.value)}
          disabled={isChecking}
          placeholder={
            "Enter supplements, one per line or comma-separated\ne.g., Vitamin D3 5000 IU, Fish Oil 2g, Magnesium Glycinate 400mg"
          }
          rows={4}
          className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent disabled:opacity-50 resize-y"
        />
      </div>

      {/* Medications textarea */}
      <div>
        <label
          htmlFor="interaction-medications"
          className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
        >
          Medications (optional)
        </label>
        <textarea
          id="interaction-medications"
          value={medications}
          onChange={(e) => setMedications(e.target.value)}
          disabled={isChecking}
          placeholder={
            "Enter medications, one per line or comma-separated\ne.g., Levothyroxine 75mcg, Metformin 500mg"
          }
          rows={3}
          className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent disabled:opacity-50 resize-y"
        />
      </div>

      {/* Action button */}
      <div className="flex items-center gap-3">
        {isChecking ? (
          <button
            onClick={abort}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)] hover:bg-red-100 transition-colors"
          >
            <StopCircle className="w-4 h-4" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleCheck}
            disabled={!supplements.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield className="w-4 h-4" />
            Check Interactions
          </button>
        )}
        {isChecking && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="w-3 h-3 animate-spin" />
            Checking interactions...
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]"
        >
          {error}
        </div>
      )}

      {/* Streaming display */}
      {isChecking && rawText && (
        <div className="max-h-60 overflow-y-auto p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
          <pre className="text-xs text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap break-words leading-relaxed">
            {rawText}
          </pre>
        </div>
      )}

      {/* Results */}
      {status === "complete" && checkData && (
        <div className="space-y-4">
          {/* Summary */}
          {checkData.summary && (
            <div className="p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[var(--color-brand-600)]" />
                <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  Interaction Summary
                </p>
              </div>
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                {checkData.summary}
              </p>
            </div>
          )}

          {/* Interaction cards */}
          {checkData.interactions && checkData.interactions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Interactions Found ({checkData.interactions.length})
              </h3>
              {checkData.interactions.map((interaction, idx) => (
                <InteractionResultCard key={idx} interaction={interaction} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)]">
              <Shield className="w-5 h-5 text-emerald-600" />
              <p className="text-sm text-emerald-700">
                No significant interactions detected.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
