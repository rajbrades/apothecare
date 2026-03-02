"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { SUPPORTED_BRANDS, KNOWN_SUPPLEMENT_BRANDS } from "@/lib/validations/supplement";
import {
  Check,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Package,
} from "lucide-react";

interface BrandPreference {
  brand_name: string;
  is_active: boolean;
  priority: number;
}

/**
 * Compact, collapsible Brand Formulary designed to sit inline
 * at the top of the Reviews tab. Shows active brand count when
 * collapsed, full management UI when expanded.
 */
export function BrandFormularyInline() {
  const [brands, setBrands] = useState<BrandPreference[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeBrands = brands.filter((b) => b.is_active);

  const suggestions = useMemo(() => {
    const q = customBrand.trim().toLowerCase();
    if (q.length < 2) return [];
    return KNOWN_SUPPLEMENT_BRANDS.filter(
      (b) =>
        b.toLowerCase().includes(q) &&
        !brands.some(
          (existing) => existing.brand_name.toLowerCase() === b.toLowerCase()
        )
    ).slice(0, 6);
  }, [customBrand, brands]);

  const isUnrecognized = useMemo(() => {
    const q = customBrand.trim();
    if (q.length < 3) return false;
    return !KNOWN_SUPPLEMENT_BRANDS.some(
      (b) => b.toLowerCase() === q.toLowerCase()
    );
  }, [customBrand]);

  // Fetch current preferences on mount
  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch("/api/supplements/brands");
        if (res.ok) {
          const data = await res.json();
          setStrictMode(data.strict_mode ?? false);
          const savedBrands: BrandPreference[] = data.brands || [];
          const merged: BrandPreference[] = SUPPORTED_BRANDS.map(
            (name, idx) => {
              const saved = savedBrands.find(
                (b: BrandPreference) => b.brand_name === name
              );
              return saved || { brand_name: name, is_active: false, priority: idx };
            }
          );
          const customBrands = savedBrands.filter(
            (b: BrandPreference) =>
              !SUPPORTED_BRANDS.includes(b.brand_name as typeof SUPPORTED_BRANDS[number])
          );
          setBrands([...merged, ...customBrands]);
        } else {
          setBrands(
            SUPPORTED_BRANDS.map((name, idx) => ({
              brand_name: name,
              is_active: false,
              priority: idx,
            }))
          );
        }
      } catch {
        setBrands(
          SUPPORTED_BRANDS.map((name, idx) => ({
            brand_name: name,
            is_active: false,
            priority: idx,
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  const toggleBrand = useCallback((brandName: string) => {
    setBrands((prev) =>
      prev.map((b) =>
        b.brand_name === brandName ? { ...b, is_active: !b.is_active } : b
      )
    );
  }, []);

  const removeBrand = useCallback((brandName: string) => {
    setBrands((prev) => prev.filter((b) => b.brand_name !== brandName));
  }, []);

  const addCustomBrand = useCallback(() => {
    const name = customBrand.trim();
    if (!name) return;
    if (brands.some((b) => b.brand_name.toLowerCase() === name.toLowerCase())) {
      toast.error("This brand is already in your list.");
      return;
    }
    setBrands((prev) => [
      ...prev,
      { brand_name: name, is_active: true, priority: prev.length },
    ]);
    setCustomBrand("");
    setShowSuggestions(false);
  }, [customBrand, brands]);

  const selectSuggestion = useCallback(
    (name: string) => {
      if (brands.some((b) => b.brand_name.toLowerCase() === name.toLowerCase())) {
        toast.error("This brand is already in your list.");
      } else {
        setBrands((prev) => [
          ...prev,
          { brand_name: name, is_active: true, priority: prev.length },
        ]);
      }
      setCustomBrand("");
      setShowSuggestions(false);
    },
    [brands]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/supplements/brands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brands: brands.map((b, idx) => ({
            brand_name: b.brand_name,
            is_active: b.is_active,
            priority: idx,
          })),
          strict_mode: strictMode,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save preferences");
      }
      toast.success("Brand preferences saved");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save preferences";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [brands, strictMode]);

  const isSupported = (name: string) =>
    SUPPORTED_BRANDS.includes(name as typeof SUPPORTED_BRANDS[number]);

  if (loading) {
    return (
      <div className="p-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading brand preferences...
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-surface)] overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--color-surface-secondary)] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Package className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Brand Formulary
          </span>
          {activeBrands.length > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
              {activeBrands.length} active
            </span>
          )}
          {strictMode && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700">
              Strict
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Active brand pills — shown when collapsed and brands are active */}
      {!expanded && activeBrands.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {activeBrands.map((b) => (
            <span
              key={b.brand_name}
              className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]"
            >
              {b.brand_name}
            </span>
          ))}
        </div>
      )}

      {/* Expanded management UI */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--color-border-light)]">
          <p className="text-xs text-[var(--color-text-muted)] pt-3">
            Select preferred brands. Active brands are prioritized in AI
            supplement reviews.
          </p>

          {/* Brand grid */}
          <div className="grid gap-1.5">
            {brands.map((brand) => (
              <div
                key={brand.brand_name}
                className={`flex items-center justify-between p-2.5 border rounded-[var(--radius-sm)] transition-colors ${
                  brand.is_active
                    ? "border-[var(--color-brand-300)] bg-[var(--color-brand-50)]"
                    : "border-[var(--color-border-light)] bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleBrand(brand.brand_name)}
                    className={`w-4 h-4 flex items-center justify-center border-2 rounded transition-colors ${
                      brand.is_active
                        ? "bg-[var(--color-brand-600)] border-[var(--color-brand-600)] text-white"
                        : "border-[var(--color-text-muted)] bg-[var(--color-surface)]"
                    }`}
                    aria-label={`${brand.is_active ? "Deactivate" : "Activate"} ${brand.brand_name}`}
                  >
                    {brand.is_active && (
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    )}
                  </button>
                  <span
                    className={`text-xs font-medium ${
                      brand.is_active
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {brand.brand_name}
                  </span>
                </div>
                {!isSupported(brand.brand_name) && (
                  <button
                    onClick={() => removeBrand(brand.brand_name)}
                    className="p-0.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                    aria-label={`Remove ${brand.brand_name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom brand */}
          <div>
            <label
              htmlFor="inline-custom-brand"
              className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1"
            >
              Add Brand
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  id="inline-custom-brand"
                  type="text"
                  value={customBrand}
                  onChange={(e) => {
                    setCustomBrand(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCustomBrand();
                    if (e.key === "Escape") setShowSuggestions(false);
                  }}
                  onFocus={() =>
                    customBrand.trim().length >= 2 && setShowSuggestions(true)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  placeholder="e.g., Thorne Research"
                  autoComplete="off"
                  className="w-full px-2.5 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-card)] overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onMouseDown={() => selectSuggestion(s)}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={addCustomBrand}
                disabled={!customBrand.trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-100)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            {isUnrecognized && !showSuggestions && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                Not in our known brands list — double-check spelling or add
                anyway.
              </p>
            )}
          </div>

          {/* Strict mode + Save — compact row */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-light)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                onClick={() => setStrictMode((prev) => !prev)}
                className={`w-4 h-4 flex-shrink-0 flex items-center justify-center border-2 rounded transition-colors ${
                  strictMode
                    ? "bg-[var(--color-brand-600)] border-[var(--color-brand-600)] text-white"
                    : "border-[var(--color-text-muted)] bg-[var(--color-surface)]"
                }`}
                aria-label={
                  strictMode
                    ? "Disable strict brand mode"
                    : "Enable strict brand mode"
                }
              >
                {strictMode && (
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                )}
              </button>
              <span className="text-xs text-[var(--color-text-secondary)]">
                Only recommend from selected brands
              </span>
            </label>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Brands"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
