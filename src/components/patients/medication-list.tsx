"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { Pill, Plus, Pencil, Check, X, Loader2, Trash2 } from "lucide-react";
import type { PatientMedication } from "@/types/database";

interface MedicationFormData {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  form: string;
  prescriber: string;
  indication: string;
}

const EMPTY_FORM: MedicationFormData = {
  name: "", dosage: "", frequency: "", route: "", form: "", prescriber: "", indication: "",
};

function buildDetailLine(med: PatientMedication): string {
  const parts: string[] = [];
  if (med.dosage) parts.push(med.dosage);
  if (med.form) parts.push(med.form);
  if (med.frequency) parts.push(med.frequency);
  if (med.route) parts.push(med.route);
  return parts.join(" · ");
}

function MedicationRow({
  medication,
  patientId,
  onUpdated,
  onDiscontinued,
}: {
  medication: PatientMedication;
  patientId: string;
  onUpdated: () => void;
  onDiscontinued: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<MedicationFormData>({
    name: medication.name,
    dosage: medication.dosage || "",
    frequency: medication.frequency || "",
    route: medication.route || "",
    form: medication.form || "",
    prescriber: medication.prescriber || "",
    indication: medication.indication || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}/medications/${medication.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onUpdated();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscontinue = async () => {
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}/medications/${medication.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "discontinued", discontinued_at: new Date().toISOString() }),
      });
      onDiscontinued();
    } finally {
      setSaving(false);
    }
  };

  const detailLine = buildDetailLine(medication);

  if (editing) {
    return (
      <div className="border border-dashed border-[var(--color-brand-300)] rounded-[var(--radius-md)] p-3 space-y-2 bg-[var(--color-brand-50)]/30">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Medication name *"
          className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Dosage (e.g., 50mg)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
          <input value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })} placeholder="Form (e.g., tablet)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
          <input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="Frequency (e.g., BID)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
          <input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="Route (e.g., oral)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
          <input value={form.prescriber} onChange={(e) => setForm({ ...form, prescriber: e.target.value })} placeholder="Prescriber (optional)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
          <input value={form.indication} onChange={(e) => setForm({ ...form, indication: e.target.value })} placeholder="Indication (optional)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand-600)] disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 group">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {medication.name}
          {medication.status === "as_needed" && (
            <span className="ml-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">PRN</span>
          )}
        </p>
        {detailLine && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{detailLine}</p>
        )}
        {medication.indication && (
          <p className="text-[11px] text-[var(--color-text-muted)] italic">For: {medication.indication}</p>
        )}
        {medication.prescriber && (
          <p className="text-[11px] text-[var(--color-text-muted)]">Rx: {medication.prescriber}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleDiscontinue} disabled={saving} className="p-1 text-[var(--color-text-muted)] hover:text-red-500" title="Discontinue">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface MedicationListProps {
  patientId: string;
}

export function MedicationList({ patientId }: MedicationListProps) {
  const [medications, setMedications] = useState<PatientMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MedicationFormData>(EMPTY_FORM);
  const nameRef = useRef<HTMLInputElement>(null);

  const fetchMedications = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/medications`);
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications || []);
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Load on mount
  useState(() => { fetchMedications(); });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(EMPTY_FORM);
        setAdding(false);
        fetchMedications();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && form.name.trim()) handleAdd();
    if (e.key === "Escape") { setAdding(false); setForm(EMPTY_FORM); }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          Current Medications
        </h3>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setTimeout(() => nameRef.current?.focus(), 50); }}
            className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />
        </div>
      ) : (
        <>
          {medications.length === 0 && !adding && (
            <button
              onClick={() => { setAdding(true); setTimeout(() => nameRef.current?.focus(), 50); }}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
            >
              + Add medication
            </button>
          )}

          <div className="divide-y divide-[var(--color-border-light)]">
            {medications.map((med) => (
              <MedicationRow
                key={med.id}
                medication={med}
                patientId={patientId}
                onUpdated={fetchMedications}
                onDiscontinued={fetchMedications}
              />
            ))}
          </div>
        </>
      )}

      {adding && (
        <div className="mt-2 border border-dashed border-[var(--color-brand-300)] rounded-[var(--radius-md)] p-3 space-y-2 bg-[var(--color-brand-50)]/30">
          <input
            ref={nameRef}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Medication name *"
            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Dosage (e.g., 50mg)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
            <input value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })} placeholder="Form (e.g., tablet)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
            <input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="Frequency (e.g., BID)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
            <input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="Route (e.g., oral)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
            <input value={form.prescriber} onChange={(e) => setForm({ ...form, prescriber: e.target.value })} placeholder="Prescriber (optional)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
            <input value={form.indication} onChange={(e) => setForm({ ...form, indication: e.target.value })} placeholder="Indication (optional)" className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setAdding(false); setForm(EMPTY_FORM); }} className="text-xs text-[var(--color-text-muted)]">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !form.name.trim()} className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand-600)] disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
