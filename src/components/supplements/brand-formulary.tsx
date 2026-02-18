"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SUPPORTED_BRANDS } from "@/lib/validations/supplement";
import { Check, Plus, X, Loader2 } from "lucide-react";

interface BrandPreference {
  brand_name: string;
  is_active: boolean;
  priority: number;
}

export function BrandFormulary() {
  const [brands, setBrands] = useState<BrandPreference[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current preferences on mount
  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch("/api/supplements/brands");
        if (res.ok) {
          const data = await res.json();
          setStrictMode(data.strict_mode ?? false);
          // Merge saved preferences with supported brands
          const savedBrands: BrandPreference[] = data.brands || [];
          const merged: BrandPreference[] = SUPPORTED_BRANDS.map(
            (name, idx) => {
              const saved = savedBrands.find(
                (b: BrandPreference) => b.brand_name === name
              );
              return saved || { brand_name: name, is_active: false, priority: idx };
            }
          );
          // Add any custom brands not in SUPPORTED_BRANDS
          const customBrands = savedBrands.filter(
            (b: BrandPreference) =>
              !SUPPORTED_BRANDS.includes(b.brand_name as typeof SUPPORTED_BRANDS[number])
          );
          setBrands([...merged, ...customBrands]);
        } else {
          // Initialize with defaults if no saved preferences
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

    // Check for duplicates
    if (brands.some((b) => b.brand_name.toLowerCase() === name.toLowerCase())) {
      toast.error("This brand is already in your list.");
      return;
    }

    setBrands((prev) => [
      ...prev,
      { brand_name: name, is_active: true, priority: prev.length },
    ]);
    setCustomBrand("");
  }, [customBrand, brands]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading brand preferences...
        </div>
      </div>
    );
  }

  const isSupported = (name: string) =>
    SUPPORTED_BRANDS.includes(name as typeof SUPPORTED_BRANDS[number]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          Preferred Supplement Brands
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          Select the brands you prefer for supplement recommendations. Active
          brands will be prioritized in reviews.
        </p>
      </div>

      {/* Brand cards */}
      <div className="grid gap-2">
        {brands.map((brand) => (
          <div
            key={brand.brand_name}
            className={`flex items-center justify-between p-3 border rounded-[var(--radius-md)] transition-colors ${
              brand.is_active
                ? "border-[var(--color-brand-300)] bg-[var(--color-brand-50)]"
                : "border-[var(--color-border-light)] bg-[var(--color-surface)]"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Toggle checkbox */}
              <button
                onClick={() => toggleBrand(brand.brand_name)}
                className={`w-[18px] h-[18px] flex items-center justify-center border-2 rounded transition-colors ${
                  brand.is_active
                    ? "bg-[var(--color-brand-600)] border-[var(--color-brand-600)] text-white"
                    : "border-[var(--color-text-muted)] bg-[var(--color-surface)]"
                }`}
                aria-label={`${brand.is_active ? "Deactivate" : "Activate"} ${brand.brand_name}`}
              >
                {brand.is_active && <Check className="w-3 h-3" strokeWidth={3} />}
              </button>

              <span
                className={`text-sm font-medium ${
                  brand.is_active
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                {brand.brand_name}
              </span>
            </div>

            {/* Remove button for custom brands */}
            {!isSupported(brand.brand_name) && (
              <button
                onClick={() => removeBrand(brand.brand_name)}
                className="p-1 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                aria-label={`Remove ${brand.brand_name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add custom brand */}
      <div>
        <label
          htmlFor="custom-brand"
          className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
        >
          Add Custom Brand
        </label>
        <div className="flex gap-2">
          <input
            id="custom-brand"
            type="text"
            value={customBrand}
            onChange={(e) => setCustomBrand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomBrand()}
            placeholder="e.g., Thorne Research"
            className="flex-1 px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
          />
          <button
            onClick={addCustomBrand}
            disabled={!customBrand.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-100)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Strict mode toggle */}
      <div className="p-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]">
        <label className="flex items-start gap-3 cursor-pointer">
          <button
            onClick={() => setStrictMode((prev) => !prev)}
            className={`mt-0.5 w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center border-2 rounded transition-colors ${
              strictMode
                ? "bg-[var(--color-brand-600)] border-[var(--color-brand-600)] text-white"
                : "border-[var(--color-text-muted)] bg-[var(--color-surface)]"
            }`}
            aria-label={strictMode ? "Disable strict brand mode" : "Enable strict brand mode"}
          >
            {strictMode && <Check className="w-3 h-3" strokeWidth={3} />}
          </button>
          <div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              Only recommend from selected brands
            </span>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              When enabled, reviews will exclusively use your selected brands.
              When off, selected brands are prioritized but others may be suggested.
            </p>
          </div>
        </label>
      </div>

      {/* Save button */}
      <div className="pt-2 border-t border-[var(--color-border-light)]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
