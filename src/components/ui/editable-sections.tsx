"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Check, X, Plus, Pencil, Loader2 } from "lucide-react";

// ── SectionShell ─────────────────────────────────────────────────────
// Wrapper that adds edit/save/cancel chrome to any content section.

export function SectionShell({
  title,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  readOnly,
  children,
}: {
  title: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          {title}
        </h3>
        {!readOnly && (
          isEditing ? (
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
          )
        )}
      </div>
      <div className="text-[var(--color-text-primary)]">{children}</div>
    </div>
  );
}

// ── EditableTextSection ──────────────────────────────────────────────
// Inline-editable long text field that saves to patient record.

export function EditableTextSection({
  title,
  value,
  patientId,
  fieldName,
  onSaved,
  readOnly,
}: {
  title: string;
  value: string | null;
  patientId: string;
  fieldName: string;
  onSaved: (field: string, value: string | null) => void;
  readOnly?: boolean;
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
      readOnly={readOnly}
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
        readOnly ? (
          <p className="text-sm text-[var(--color-text-muted)]">—</p>
        ) : (
          <button
            onClick={handleEdit}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add {title.toLowerCase()}
          </button>
        )
      )}
    </SectionShell>
  );
}

// ── EditableTagSection ───────────────────────────────────────────────
// Inline-editable tag array field that saves to patient record.

export function EditableTagSection({
  title,
  values,
  patientId,
  fieldName,
  onSaved,
  tagColor = "brand",
  readOnly,
}: {
  title: string;
  values: string[] | null;
  patientId: string;
  fieldName: string;
  onSaved: (field: string, value: string[] | null) => void;
  tagColor?: "brand" | "red";
  readOnly?: boolean;
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
      readOnly={readOnly}
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
        readOnly ? (
          <p className="text-sm text-[var(--color-text-muted)]">—</p>
        ) : (
          <button
            onClick={handleEdit}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add {title.toLowerCase()}
          </button>
        )
      )}
    </SectionShell>
  );
}
