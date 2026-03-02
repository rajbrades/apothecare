"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Practitioner, LicenseType, VerificationStatus } from "@/types/database";
import {
  LICENSE_OPTIONS,
  validateNpi,
  US_STATES,
  SPECIALTY_OPTIONS,
} from "@/lib/constants/practitioner";

interface CredentialsSectionProps {
  practitioner: Practitioner;
}

const STATUS_CONFIG: Record<VerificationStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  verified: { icon: CheckCircle2, label: "Verified", className: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  pending: { icon: Clock, label: "Pending Review", className: "text-amber-600 bg-amber-50 border-amber-200" },
  rejected: { icon: XCircle, label: "Rejected", className: "text-red-600 bg-red-50 border-red-200" },
  expired: { icon: AlertCircle, label: "Expired", className: "text-gray-600 bg-gray-50 border-gray-200" },
};

export function CredentialsSection({ practitioner }: CredentialsSectionProps) {
  const [licenseType, setLicenseType] = useState<LicenseType>(practitioner.license_type);
  const [licenseNumber, setLicenseNumber] = useState(practitioner.license_number || "");
  const [licenseState, setLicenseState] = useState(practitioner.license_state || "");
  const [npi, setNpi] = useState(practitioner.npi || "");
  const [npiError, setNpiError] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState(practitioner.practice_name || "");
  const [specialties, setSpecialties] = useState<string[]>(practitioner.specialty_focus || []);
  const [yearsInPractice, setYearsInPractice] = useState(
    practitioner.years_in_practice?.toString() || ""
  );
  const [saving, setSaving] = useState(false);

  const selectedLicense = LICENSE_OPTIONS.find((l) => l.value === licenseType);

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    // NPI validation
    if (selectedLicense?.npiRequired && npi) {
      if (npi.length !== 10) {
        setNpiError("NPI must be exactly 10 digits.");
        return;
      }
      if (!validateNpi(npi)) {
        setNpiError("Invalid NPI — check digit failed.");
        return;
      }
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        license_type: licenseType,
        license_number: licenseNumber || null,
        license_state: licenseState || null,
        npi: npi || null,
        practice_name: practiceName || null,
        specialty_focus: specialties.length > 0 ? specialties : null,
      };

      if (yearsInPractice !== "") {
        body.years_in_practice = parseInt(yearsInPractice, 10);
      }

      const res = await fetch("/api/practitioners/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update credentials");
        return;
      }

      toast.success("Credentials updated");
    } catch {
      toast.error("Failed to update credentials");
    } finally {
      setSaving(false);
    }
  };

  const status = STATUS_CONFIG[practitioner.verification_status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Practice & Credentials
        </h2>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${status.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>
      </div>

      <div className="space-y-5">
        {/* License Type */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            License Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LICENSE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLicenseType(opt.value)}
                className={`text-left px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border transition-all ${
                  licenseType === opt.value
                    ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                    : "border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-200)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* License Number + State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              License Number
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              State
            </label>
            <select
              value={licenseState}
              onChange={(e) => setLicenseState(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)]"
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NPI */}
        {selectedLicense?.npiRequired && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              NPI Number
            </label>
            <input
              type="text"
              value={npi}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setNpi(value);
                if (npiError) setNpiError(null);
              }}
              onBlur={() => {
                if (npi.length === 0) setNpiError(null);
                else if (npi.length !== 10) setNpiError("NPI must be exactly 10 digits.");
                else if (!validateNpi(npi)) setNpiError("Invalid NPI — check digit failed.");
                else setNpiError(null);
              }}
              placeholder="10-digit NPI"
              maxLength={10}
              className={`w-full max-w-sm px-4 py-2.5 text-sm border rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-[var(--font-mono)] ${
                npiError
                  ? "border-red-400 focus:border-red-500"
                  : "border-[var(--color-border)] focus:border-[var(--color-brand-400)]"
              }`}
            />
            {npiError && (
              <p className="mt-1.5 text-xs text-red-600">{npiError}</p>
            )}
          </div>
        )}

        {/* Practice Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Practice Name
          </label>
          <input
            type="text"
            value={practiceName}
            onChange={(e) => setPracticeName(e.target.value)}
            placeholder="e.g., Integrative Health Center"
            className="w-full max-w-sm px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        {/* Years in Practice */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Years in Practice
          </label>
          <input
            type="number"
            value={yearsInPractice}
            onChange={(e) => setYearsInPractice(e.target.value)}
            placeholder="e.g., 12"
            min={0}
            max={80}
            className="w-32 px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        {/* Clinical Focus */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Clinical Focus Areas
          </label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  specialties.includes(s)
                    ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                    : "border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-200)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-[var(--color-border-light)]">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
