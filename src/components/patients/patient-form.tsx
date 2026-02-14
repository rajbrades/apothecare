"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";

export function PatientForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<string>("");
  const [chiefComplaints, setChiefComplaints] = useState<string[]>([]);
  const [complaintInput, setComplaintInput] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [supplements, setSupplements] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [notes, setNotes] = useState("");

  const addChiefComplaint = () => {
    const val = complaintInput.trim();
    if (val && !chiefComplaints.includes(val)) {
      setChiefComplaints([...chiefComplaints, val]);
      setComplaintInput("");
    }
  };

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (val && !allergies.includes(val)) {
      setAllergies([...allergies, val]);
      setAllergyInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          medical_history: medicalHistory || null,
          current_medications: currentMedications || null,
          supplements: supplements || null,
          allergies: allergies.length ? allergies : null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create patient");
      }

      const { patient } = await res.json();
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent";
  const labelClass = "block text-xs font-medium text-[var(--color-text-secondary)] mb-1";

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to patients
      </Link>

      <h1 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
        New Patient
      </h1>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First Name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="First name" />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Last name" />
          </div>
        </div>

        {/* DOB + Sex */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sex</label>
            <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Chief Complaints */}
        <div>
          <label className={labelClass}>Chief Complaints</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={complaintInput}
              onChange={(e) => setComplaintInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChiefComplaint())}
              className={inputClass}
              placeholder="Type and press Enter"
            />
            <button type="button" onClick={addChiefComplaint} className="px-3 py-2 text-xs font-medium text-[var(--color-brand-600)] border border-[var(--color-brand-200)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-50)]">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {chiefComplaints.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chiefComplaints.map((cc) => (
                <span key={cc} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--color-brand-50)] text-[var(--color-brand-700)] rounded-full">
                  {cc}
                  <button type="button" onClick={() => setChiefComplaints(chiefComplaints.filter((c) => c !== cc))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Medical History */}
        <div>
          <label className={labelClass}>Medical History</label>
          <textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Past diagnoses, conditions, surgeries..." />
        </div>

        {/* Medications + Supplements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Current Medications</label>
            <textarea value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="List current medications..." />
          </div>
          <div>
            <label className={labelClass}>Current Supplements</label>
            <textarea value={supplements} onChange={(e) => setSupplements(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="List current supplements..." />
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className={labelClass}>Allergies</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
              className={inputClass}
              placeholder="Type and press Enter"
            />
            <button type="button" onClick={addAllergy} className="px-3 py-2 text-xs font-medium text-[var(--color-brand-600)] border border-[var(--color-brand-200)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-50)]">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded-full">
                  {a}
                  <button type="button" onClick={() => setAllergies(allergies.filter((al) => al !== a))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} min-h-[60px] resize-y`} placeholder="Additional notes..." />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Patient
          </button>
        </div>
      </form>
    </div>
  );
}
