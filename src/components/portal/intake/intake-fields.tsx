"use client";

import { Plus, X } from "lucide-react";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { COMMON_ALLERGENS } from "@/lib/constants/allergens";

// ── Shared field components for intake form ─────────────────────────────

interface TextFieldProps {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "tel" | "date" | "number";
  optional?: boolean;
}

export function TextField({ label, hint, placeholder, value, onChange, type = "text", optional }: TextFieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        {label}
        {optional && <span className="font-normal italic normal-case tracking-normal ml-1">(optional)</span>}
      </label>
      {hint && <p className="text-[12px] italic text-[var(--color-text-muted)] mb-2">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-all"
      />
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}

export function TextAreaField({ label, hint, placeholder, value, onChange, rows = 3 }: TextAreaFieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      {hint && <p className="text-[12px] italic text-[var(--color-text-muted)] mb-2">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-all resize-y leading-relaxed"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}

export function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      {hint && <p className="text-[12px] italic text-[var(--color-text-muted)] mb-2">{hint}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%237a7a7a%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_14px_center] pr-9"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface CheckboxGridProps {
  label?: string;
  hint?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  columns?: 1 | 2 | 3;
}

export function CheckboxGrid({ label, hint, options, selected, onChange, columns = 2 }: CheckboxGridProps) {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  const colClass = columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
          {label}
        </label>
      )}
      {hint && <p className="text-[12px] italic text-[var(--color-text-muted)] mb-2">{hint}</p>}
      <div className={`grid ${colClass} gap-2`}>
        {options.map((option) => {
          const isChecked = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`flex items-start gap-2.5 px-3 py-2.5 text-left text-[13px] rounded-lg border transition-all ${
                isChecked
                  ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]/50"
              }`}
            >
              <span className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                isChecked
                  ? "bg-[var(--color-brand-600)] border-[var(--color-brand-600)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }`}>
                {isChecked && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="leading-snug">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface RadioGroupProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  columns?: 1 | 2;
}

export function RadioGroup({ label, options, value, onChange, columns = 2 }: RadioGroupProps) {
  const colClass = columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      <div className={`grid ${colClass} gap-2`}>
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex items-start gap-2.5 px-3 py-2.5 text-left text-[13px] rounded-lg border transition-all ${
                isSelected
                  ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-300)]"
              }`}
            >
              <span className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                isSelected
                  ? "border-[var(--color-brand-600)]"
                  : "border-[var(--color-border)]"
              }`}>
                {isSelected && <span className="w-2 h-2 rounded-full bg-[var(--color-brand-600)]" />}
              </span>
              <span className="leading-snug">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
}

export function SliderField({ label, value, onChange, min = 0, max = 10, lowLabel = "None", highLabel = "Severe" }: SliderFieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-1.5 accent-[var(--color-brand-600)] bg-[var(--color-border)] rounded-full cursor-pointer"
        />
        <span className="text-sm font-mono font-medium text-[var(--color-brand-600)] min-w-[20px] text-center">
          {value}
        </span>
      </div>
      <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] italic mt-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

interface DynamicRowField {
  placeholder: string;
  width?: string;
  autocomplete?: { type: "medication" | "allergen" | "supplement" };
}

interface DynamicRowsProps {
  label: string;
  hint?: string;
  fields: DynamicRowField[];
  rows: string[][];
  onChange: (rows: string[][]) => void;
  addLabel: string;
}

async function fetchMedicationSuggestions(term: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/rxnorm/suggest?term=${encodeURIComponent(term)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions ?? [];
  } catch {
    return [];
  }
}

async function fetchSupplementSuggestions(term: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/supplements/suggest?term=${encodeURIComponent(term)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions ?? [];
  } catch {
    return [];
  }
}

export function DynamicRows({ label, hint, fields, rows, onChange, addLabel }: DynamicRowsProps) {
  const addRow = () => onChange([...rows, fields.map(() => "")]);
  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== idx));
  };
  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const updated = rows.map((row, i) =>
      i === rowIdx ? row.map((cell, j) => (j === colIdx ? value : cell)) : row
    );
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      {hint && <p className="text-[12px] italic text-[var(--color-text-muted)] mb-2">{hint}</p>}
      <div className="space-y-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-2 items-start">
            {fields.map((field, ci) => {
              const cellValue = row[ci] || "";
              const inputClass = "w-full px-3 py-2.5 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-all";

              if (field.autocomplete?.type === "medication") {
                return (
                  <AutocompleteInput
                    key={ci}
                    value={cellValue}
                    onChange={(v) => updateCell(ri, ci, v)}
                    placeholder={field.placeholder}
                    fetchSuggestions={fetchMedicationSuggestions}
                    className={inputClass}
                    style={field.width ? { maxWidth: field.width } : undefined}
                  />
                );
              }

              if (field.autocomplete?.type === "allergen") {
                return (
                  <AutocompleteInput
                    key={ci}
                    value={cellValue}
                    onChange={(v) => updateCell(ri, ci, v)}
                    placeholder={field.placeholder}
                    suggestions={COMMON_ALLERGENS}
                    className={inputClass}
                    style={field.width ? { maxWidth: field.width } : undefined}
                  />
                );
              }

              if (field.autocomplete?.type === "supplement") {
                return (
                  <AutocompleteInput
                    key={ci}
                    value={cellValue}
                    onChange={(v) => updateCell(ri, ci, v)}
                    placeholder={field.placeholder}
                    fetchSuggestions={fetchSupplementSuggestions}
                    className={inputClass}
                    style={field.width ? { maxWidth: field.width } : undefined}
                  />
                );
              }

              return (
                <input
                  key={ci}
                  type="text"
                  placeholder={field.placeholder}
                  value={cellValue}
                  onChange={(e) => updateCell(ri, ci, e.target.value)}
                  className={`flex-1 ${inputClass}`}
                  style={field.width ? { maxWidth: field.width } : undefined}
                />
              );
            })}
            <button
              type="button"
              onClick={() => removeRow(ri)}
              className="w-9 h-10 flex-shrink-0 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 mt-3 px-4 py-2 text-[13px] font-medium text-[var(--color-brand-600)] border border-dashed border-[var(--color-brand-300)] rounded-lg hover:bg-[var(--color-brand-50)] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────

export function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const colClass = cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
  return <div className={`grid ${colClass} gap-5`}>{children}</div>;
}

export function Subsection({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mt-8 mb-4 pb-2 border-b border-[var(--color-border-light)]">
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] italic">
        {title}
      </h3>
      {desc && <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{desc}</p>}
    </div>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 border-l-[3px] border-l-amber-400 text-[13px] text-amber-800 leading-relaxed">
      {children}
    </div>
  );
}

interface SectionCardProps {
  num: number;
  total: number;
  title: string;
  why: string;
  children: React.ReactNode;
}

export function SectionCard({ num, total, title, why, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="px-7 py-5 border-b border-[var(--color-border)]">
        <p className="text-[10px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-1">
          Section {num} of {total}
        </p>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] font-[var(--font-display)]">
          {title}
        </h2>
        <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mt-1 max-w-[520px]">
          {why}
        </p>
      </div>
      {/* Body */}
      <div className="px-7 py-7 space-y-5">
        {children}
      </div>
    </div>
  );
}
