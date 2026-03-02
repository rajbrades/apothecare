"use client";

import { useState, useCallback, useMemo } from "react";
import { Loader2, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Practitioner } from "@/types/database";
import {
  EVIDENCE_SOURCES,
  SOURCE_PRESETS,
  ALL_SOURCE_IDS,
  matchPreset,
  type SourceId,
} from "@/lib/ai/source-filter";
import { KNOWN_SUPPLEMENT_BRANDS } from "@/lib/validations/supplement";
import { NOTE_TEMPLATE_OPTIONS } from "@/lib/constants/practitioner";

interface BrandPref {
  id: string;
  brand_name: string;
  priority: number;
  is_active: boolean;
}

interface PreferencesSectionProps {
  practitioner: Practitioner;
  initialBrands: BrandPref[];
  initialStrictMode: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  functional: "Functional / Integrative",
  conventional: "Conventional",
  general: "General Literature",
};

const CATEGORY_ORDER = ["functional", "conventional", "general"] as const;

export function PreferencesSection({
  practitioner,
  initialBrands,
  initialStrictMode,
}: PreferencesSectionProps) {
  // ── Evidence Sources ──────────────────────────────────────────────
  const [selectedSources, setSelectedSources] = useState<SourceId[]>(
    (practitioner.preferred_evidence_sources as SourceId[]) || [...ALL_SOURCE_IDS]
  );
  const [savingSources, setSavingSources] = useState(false);

  const activePreset = matchPreset(selectedSources);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    sources: Object.values(EVIDENCE_SOURCES).filter((s) => s.category === cat),
  }));

  const toggleSource = useCallback(
    (sourceId: SourceId) => {
      setSelectedSources((prev) => {
        if (prev.includes(sourceId)) {
          if (prev.length <= 1) return prev;
          return prev.filter((s) => s !== sourceId);
        }
        return [...prev, sourceId];
      });
    },
    []
  );

  const applyPreset = useCallback((presetId: string) => {
    const preset = SOURCE_PRESETS.find((p) => p.id === presetId);
    if (preset) setSelectedSources([...preset.sources]);
  }, []);

  const handleSaveSources = async () => {
    setSavingSources(true);
    try {
      const res = await fetch("/api/practitioners/evidence-sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: selectedSources }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save sources");
        return;
      }
      toast.success("Evidence sources saved");
    } catch {
      toast.error("Failed to save sources");
    } finally {
      setSavingSources(false);
    }
  };

  // ── Brand Preferences ─────────────────────────────────────────────
  const [brands, setBrands] = useState<string[]>(initialBrands.map((b) => b.brand_name));
  const [strictMode, setStrictMode] = useState(initialStrictMode);
  const [newBrand, setNewBrand] = useState("");
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [savingBrands, setSavingBrands] = useState(false);

  const handleBrandInput = (value: string) => {
    setNewBrand(value);
    if (value.length >= 2) {
      const filtered = KNOWN_SUPPLEMENT_BRANDS.filter(
        (b) =>
          b.toLowerCase().includes(value.toLowerCase()) && !brands.includes(b)
      ).slice(0, 5);
      setBrandSuggestions(filtered);
    } else {
      setBrandSuggestions([]);
    }
  };

  const addBrand = (brand: string) => {
    if (brand.trim() && !brands.includes(brand.trim())) {
      setBrands((prev) => [...prev, brand.trim()]);
    }
    setNewBrand("");
    setBrandSuggestions([]);
  };

  const removeBrand = (brand: string) => {
    setBrands((prev) => prev.filter((b) => b !== brand));
  };

  const handleSaveBrands = async () => {
    setSavingBrands(true);
    try {
      const res = await fetch("/api/supplements/brands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brands: brands.map((b, i) => ({
            brand_name: b,
            priority: i,
            is_active: true,
          })),
          strict_mode: strictMode,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save brands");
        return;
      }
      toast.success("Brand preferences saved");
    } catch {
      toast.error("Failed to save brands");
    } finally {
      setSavingBrands(false);
    }
  };

  // ── Default Note Template ─────────────────────────────────────────
  const [noteTemplate, setNoteTemplate] = useState(practitioner.default_note_template || "soap");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/practitioners/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_note_template: noteTemplate }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save template");
        return;
      }
      toast.success("Default template updated");
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">
        Clinical Preferences
      </h2>

      {/* ── Evidence Sources ────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
            Evidence Sources
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Default sources the AI prioritizes in responses.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                activePreset?.id === preset.id
                  ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-300)]"
                  : "text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-brand-300)]"
              }`}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Source checkboxes */}
        <div className="space-y-3">
          {grouped.map(({ category, label, sources }) => (
            <div key={category}>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-1.5">
                {label}
              </p>
              <div className="space-y-0.5">
                {sources.map((source) => {
                  const isSelected = selectedSources.includes(source.id as SourceId);
                  return (
                    <button
                      key={source.id}
                      onClick={() => toggleSource(source.id as SourceId)}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 text-left text-xs rounded-md transition-colors ${
                        isSelected
                          ? "text-[var(--color-text-primary)] bg-[var(--color-brand-50)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)]"
                            : "border-[var(--color-border)] bg-transparent"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span>
                        <span className="font-medium">{source.name}</span>
                        {source.fullName !== source.name && (
                          <span className="text-[var(--color-text-muted)] ml-1.5">
                            {source.fullName}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveSources} disabled={savingSources} size="sm" variant="outline">
            {savingSources && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Save Sources
          </Button>
        </div>
      </div>

      <div className="h-px bg-[var(--color-border-light)] mb-6" />

      {/* ── Brand Preferences ──────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
            Supplement Brand Preferences
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Preferred brands for protocol recommendations.
          </p>
        </div>

        {/* Brand list */}
        {brands.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <span
                key={brand}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)] rounded-full"
              >
                {brand}
                <button
                  onClick={() => removeBrand(brand)}
                  className="text-[var(--color-brand-400)] hover:text-[var(--color-brand-700)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add brand input */}
        <div className="relative max-w-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={newBrand}
              onChange={(e) => handleBrandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newBrand.trim()) {
                  e.preventDefault();
                  addBrand(newBrand);
                }
              }}
              placeholder="Add a brand..."
              className="flex-1 px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <Button
              onClick={() => addBrand(newBrand)}
              disabled={!newBrand.trim()}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions */}
          {brandSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-card)] z-10 py-1">
              {brandSuggestions.map((brand) => (
                <button
                  key={brand}
                  onClick={() => addBrand(brand)}
                  className="w-full text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Strict mode toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            role="switch"
            aria-checked={strictMode}
            onClick={() => setStrictMode(!strictMode)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              strictMode ? "bg-[var(--color-brand-500)]" : "bg-[var(--color-border)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                strictMode ? "translate-x-4" : ""
              }`}
            />
          </button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            Strict mode — only recommend from preferred brands
          </span>
        </label>

        <div className="flex justify-end">
          <Button onClick={handleSaveBrands} disabled={savingBrands} size="sm" variant="outline">
            {savingBrands && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Save Brands
          </Button>
        </div>
      </div>

      <div className="h-px bg-[var(--color-border-light)] mb-6" />

      {/* ── Default Note Template ──────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
            Default Note Template
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Template used for new visit notes.
          </p>
        </div>

        <select
          value={noteTemplate}
          onChange={(e) => setNoteTemplate(e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)]"
        >
          {NOTE_TEMPLATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {noteTemplate !== (practitioner.default_note_template || "soap") && (
          <div className="flex justify-end">
            <Button onClick={handleSaveTemplate} disabled={savingTemplate} size="sm" variant="outline">
              {savingTemplate && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
