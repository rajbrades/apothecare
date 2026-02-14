"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Logomark } from "@/components/ui/logomark";
import type { LicenseType } from "@/types/database";

const licenseOptions: { value: LicenseType; label: string; npiRequired: boolean }[] = [
  { value: "md", label: "MD — Doctor of Medicine", npiRequired: true },
  { value: "do", label: "DO — Doctor of Osteopathic Medicine", npiRequired: true },
  { value: "np", label: "NP / APRN — Nurse Practitioner", npiRequired: true },
  { value: "pa", label: "PA-C — Physician Assistant", npiRequired: true },
  { value: "dc", label: "DC — Doctor of Chiropractic", npiRequired: false },
  { value: "nd", label: "ND — Naturopathic Doctor", npiRequired: false },
  { value: "lac", label: "LAc — Licensed Acupuncturist", npiRequired: false },
  { value: "other", label: "Other Healthcare Professional", npiRequired: false },
];

/**
 * Validates an NPI (National Provider Identifier) using the Luhn mod 10
 * check digit algorithm. Per CMS specification, the NPI is validated by
 * prepending the constant "80840" to the 10-digit NPI, then running the
 * standard Luhn check on the resulting 15-digit string.
 */
function validateNpi(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) return false;

  const digits = ("80840" + npi).split("").map(Number);
  let sum = 0;

  // Luhn: walk right-to-left, doubling every second digit from the right
  for (let i = digits.length - 1; i >= 0; i--) {
    const distFromRight = digits.length - 1 - i;
    let d = digits[i];
    if (distFromRight % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }

  return sum % 10 === 0;
}

const specialtyOptions = [
  "Hormone Optimization",
  "GI / Gut Health",
  "Metabolic / Weight Management",
  "Thyroid / Autoimmune",
  "Mental Health / Neurology",
  "Detox / Environmental Medicine",
  "Anti-Aging / Longevity",
  "Pain Management",
  "Pediatrics",
  "Women's Health",
  "Men's Health",
  "General Functional Medicine",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [licenseType, setLicenseType] = useState<LicenseType | "">("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [npi, setNpi] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [npiError, setNpiError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const selectedLicense = licenseOptions.find((l) => l.value === licenseType);

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleComplete = async () => {
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Session expired. Please sign in again.");
        return;
      }

      const { error: insertError } = await supabase
        .from("practitioners")
        .insert({
          auth_user_id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!,
          license_type: licenseType as LicenseType,
          license_number: licenseNumber || null,
          license_state: licenseState || null,
          npi: npi || null,
          practice_name: practiceName || null,
          specialty_focus: specialties.length > 0 ? specialties : null,
          verification_status: "pending" as const,
          subscription_tier: "free" as const,
          subscription_status: "active" as const,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          // Duplicate — profile already exists, just redirect
          router.push("/dashboard");
          return;
        }
        setError(insertError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)] px-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Logomark size="md" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mt-4 font-[var(--font-display)]">
            Welcome to Apotheca
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Tell us about your practice so we can customize your experience.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 max-w-xs mx-auto">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step
                  ? "bg-[var(--color-brand-500)]"
                  : "bg-[var(--color-border-light)]"
              }`}
            />
          ))}
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Credentials
              </h2>

              {/* License Type */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  License Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {licenseOptions.map((opt) => (
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
              {licenseType && (
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
                    <input
                      type="text"
                      value={licenseState}
                      onChange={(e) => setLicenseState(e.target.value)}
                      placeholder="e.g., FL"
                      maxLength={2}
                      className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] uppercase"
                    />
                  </div>
                </div>
              )}

              {/* NPI */}
              {selectedLicense?.npiRequired && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                    NPI Number {selectedLicense.npiRequired ? "*" : "(optional)"}
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
                      if (npi.length === 0) {
                        setNpiError(null);
                      } else if (npi.length !== 10) {
                        setNpiError("NPI must be exactly 10 digits.");
                      } else if (!validateNpi(npi)) {
                        setNpiError("Invalid NPI — check digit failed. Please verify your number.");
                      } else {
                        setNpiError(null);
                      }
                    }}
                    placeholder="10-digit NPI"
                    maxLength={10}
                    className={`w-full px-4 py-2.5 text-sm border rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-[var(--font-mono)] ${
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

              <button
                onClick={() => {
                  if (selectedLicense?.npiRequired) {
                    if (npi.length === 0) {
                      setNpiError("NPI is required for your license type.");
                      return;
                    }
                    if (npi.length !== 10) {
                      setNpiError("NPI must be exactly 10 digits.");
                      return;
                    }
                    if (!validateNpi(npi)) {
                      setNpiError("Invalid NPI — check digit failed. Please verify your number.");
                      return;
                    }
                  }
                  setStep(2);
                }}
                disabled={!licenseType}
                className="w-full py-2.5 bg-[var(--color-brand-700)] text-white text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>

              <button
                onClick={() => {
                  setLicenseType("other");
                  setStep(2);
                }}
                className="w-full text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                Skip for now →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Practice Profile
              </h2>

              {/* Practice Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Practice Name (optional)
                </label>
                <input
                  type="text"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  placeholder="e.g., Integrative Health Center"
                  className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              {/* Specialty Focus */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Clinical Focus Areas (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {specialtyOptions.map((s) => (
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

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-sm font-medium rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[var(--color-brand-700)] text-white text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Setting up..." : "Launch Apotheca →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
