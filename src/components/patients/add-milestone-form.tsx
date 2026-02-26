"use client";

import { useState } from "react";
import { Loader2, X, Flag } from "lucide-react";
import { toast } from "sonner";

interface AddMilestoneFormProps {
  patientId: string;
  onClose: () => void;
  onCreated: () => void;
}

const MILESTONE_CATEGORIES = [
  "Diet",
  "Supplement",
  "Lifestyle",
  "Lab Recheck",
  "Follow-up",
  "Protocol Start",
  "Protocol End",
  "Detox Phase",
  "Reintroduction",
];

export function AddMilestoneForm({
  patientId,
  onClose,
  onCreated,
}: AddMilestoneFormProps) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestoneDate, setMilestoneDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!milestoneDate) {
      toast.error("Date is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/patients/${patientId}/protocol-milestones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            milestone_date: new Date(
              milestoneDate + "T00:00:00"
            ).toISOString(),
            category: category || null,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add milestone");
      }
      toast.success("Milestone added");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add milestone"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-purple-500" />
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Add Milestone
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Completed 30-day elimination diet"
          className="w-full px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Date *
          </label>
          <input
            type="date"
            value={milestoneDate}
            onChange={(e) => setMilestoneDate(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          >
            <option value="">—</option>
            {MILESTONE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Details about this milestone..."
          className="w-full px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim() || !milestoneDate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-[var(--radius-sm)] disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Add Milestone
        </button>
      </div>
    </div>
  );
}
