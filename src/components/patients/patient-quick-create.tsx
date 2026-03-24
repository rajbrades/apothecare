"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface PatientQuickCreateProps {
  open: boolean;
  onClose: () => void;
  onCreated: (patient: { id: string; first_name: string | null; last_name: string | null }) => void;
}

export function PatientQuickCreate({ open, onClose, onCreated }: PatientQuickCreateProps) {
  const trapRef = useFocusTrap(open, onClose);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [chiefComplaints, setChiefComplaints] = useState<string[]>([]);
  const [complaintInput, setComplaintInput] = useState("");

  const addChiefComplaint = () => {
    const val = complaintInput.trim();
    if (val && !chiefComplaints.includes(val)) {
      setChiefComplaints([...chiefComplaints, val]);
      setComplaintInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) {
      setError("At least a first or last name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName || null,
          last_name: lastName || null,
          date_of_birth: dob || null,
          sex: sex || null,
          chief_complaints: chiefComplaints.length ? chiefComplaints : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create patient");
      }

      const { patient } = await res.json();
      onCreated(patient);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setTouched({});
    setDob("");
    setSex("");
    setChiefComplaints([]);
    setComplaintInput("");
    setError(null);
  };

  if (!open) return null;

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent";
  const labelClass = "block text-xs font-medium text-[var(--color-text-secondary)] mb-1";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-create-title"
          className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-light)]">
            <h2 id="quick-create-title" className="text-sm font-semibold text-[var(--color-text-primary)]">
              New Patient
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {error && (
              <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pqc-first-name" className={labelClass}>First Name</label>
                <input
                  id="pqc-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
                  className={inputClass}
                  placeholder="First name"
                  autoFocus
                />
                {touched.firstName && !firstName.trim() && !lastName.trim() && (
                  <p className="text-xs text-red-500 mt-1">First or last name is required</p>
                )}
              </div>
              <div>
                <label htmlFor="pqc-last-name" className={labelClass}>Last Name</label>
                <input
                  id="pqc-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
                  className={inputClass}
                  placeholder="Last name"
                />
                {touched.lastName && !lastName.trim() && !firstName.trim() && (
                  <p className="text-xs text-red-500 mt-1">First or last name is required</p>
                )}
              </div>
            </div>

            {/* DOB + Sex */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pqc-dob" className={labelClass}>Date of Birth</label>
                <input
                  id="pqc-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="pqc-sex" className={labelClass}>Sex</label>
                <select
                  id="pqc-sex"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Chief Complaints */}
            <div>
              <label htmlFor="pqc-complaint" className={labelClass}>Chief Complaints</label>
              <div className="flex gap-2 mb-2">
                <input
                  id="pqc-complaint"
                  type="text"
                  value={complaintInput}
                  onChange={(e) => setComplaintInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChiefComplaint();
                    }
                  }}
                  className={inputClass}
                  placeholder="Type and press Enter"
                />
                <button
                  type="button"
                  onClick={addChiefComplaint}
                  className="px-3 py-2 text-xs font-medium text-[var(--color-brand-600)] border border-[var(--color-brand-200)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-50)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {chiefComplaints.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {chiefComplaints.map((cc) => (
                    <span
                      key={cc}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--color-brand-50)] text-[var(--color-brand-700)] rounded-full"
                    >
                      {cc}
                      <button
                        type="button"
                        onClick={() => setChiefComplaints(chiefComplaints.filter((c) => c !== cc))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Patient
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
