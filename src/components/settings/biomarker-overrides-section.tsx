"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BiomarkerRangeOverride {
  biomarker_code: string;
  biomarker_name: string;
  functional_low: number | null;
  functional_high: number | null;
}

export function BiomarkerOverridesSection() {
  const [overrides, setOverrides] = useState<BiomarkerRangeOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for adding new override
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newLow, setNewLow] = useState("");
  const [newHigh, setNewHigh] = useState("");

  useEffect(() => {
    fetchOverrides();
  }, []);

  const fetchOverrides = async () => {
    try {
      const res = await fetch("/api/practitioners/biomarker-ranges");
      if (!res.ok) throw new Error("Failed to fetch overrides");
      const data = await res.json();
      setOverrides(data.ranges || []);
    } catch (err) {
      toast.error("Failed to load biomarker overrides");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedOverrides: BiomarkerRangeOverride[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/practitioners/biomarker-ranges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOverrides),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save overrides");
      }

      setOverrides(updatedOverrides);
      toast.success("Biomarker overrides saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save biomarker overrides");
    } finally {
      setSaving(false);
    }
  };

  const addOverride = () => {
    if (!newCode || !newName) {
      toast.error("Code and Name are required");
      return;
    }

    const lowNum = newLow ? parseFloat(newLow) : null;
    const highNum = newHigh ? parseFloat(newHigh) : null;

    if (lowNum !== null && isNaN(lowNum)) {
      toast.error("Low value must be a valid number");
      return;
    }

    if (highNum !== null && isNaN(highNum)) {
      toast.error("High value must be a valid number");
      return;
    }

    // Check if duplicate code
    if (overrides.some(o => o.biomarker_code.toUpperCase() === newCode.toUpperCase())) {
      toast.error("An override for this biomarker code already exists.");
      return;
    }

    const newOverride: BiomarkerRangeOverride = {
      biomarker_code: newCode.toUpperCase(),
      biomarker_name: newName,
      functional_low: lowNum,
      functional_high: highNum,
    };

    const updated = [...overrides, newOverride];
    handleSave(updated);

    // Reset form
    setNewCode("");
    setNewName("");
    setNewLow("");
    setNewHigh("");
  };

  const removeOverride = (codeToRemove: string) => {
    if (confirm("Are you sure you want to remove this override?")) {
        const updated = overrides.filter((o) => o.biomarker_code !== codeToRemove);
        handleSave(updated);
    }
  };


  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 mt-8">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Functional Biomarker Ranges
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Override the default AI functional ranges for specific biomarkers. These ranges will be applied during lab parsing.
        </p>
      </div>

      {/* Existing Overrides List */}
      {overrides.length > 0 ? (
        <div className="mb-6">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                  <th className="py-2 px-3 font-medium">Code</th>
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Low Range</th>
                  <th className="py-2 px-3 font-medium">High Range</th>
                  <th className="py-2 px-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {overrides.map((override) => (
                  <tr key={override.biomarker_code} className="border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)]/50">
                    <td className="py-2.5 px-3 font-medium text-[var(--color-text-primary)]">{override.biomarker_code}</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">{override.biomarker_name}</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">{override.functional_low ?? "—"}</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">{override.functional_high ?? "—"}</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => removeOverride(override.biomarker_code)}
                        className="p-1.5 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove override"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {overrides.map((override) => (
              <div key={override.biomarker_code} className="p-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-surface)]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm text-[var(--color-text-primary)]">{override.biomarker_code}</span>
                    <span className="text-sm text-[var(--color-text-secondary)] ml-2">{override.biomarker_name}</span>
                  </div>
                  <button
                    onClick={() => removeOverride(override.biomarker_code)}
                    className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove override"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-4 text-xs text-[var(--color-text-secondary)]">
                  <span>Low: <span className="font-medium text-[var(--color-text-primary)]">{override.functional_low ?? "—"}</span></span>
                  <span>High: <span className="font-medium text-[var(--color-text-primary)]">{override.functional_high ?? "—"}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-6 h-6 text-[var(--color-text-tertiary)] mb-2" />
            <p className="text-sm text-[var(--color-text-secondary)]">No custom ranges configured.</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Add a new override below to customize functional ranges.</p>
        </div>
      )}

      {/* Add New Override Form */}
      <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4">
        <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Add Custom Range</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Code (e.g., TSH)</label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="TSH"
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] text-[var(--color-text-primary)] uppercase"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Thyroid Stimulating..."
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] text-[var(--color-text-primary)]"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Functional Low</label>
            <input
              type="number"
              step="any"
              value={newLow}
              onChange={(e) => setNewLow(e.target.value)}
              placeholder="Opt. lowest value"
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] text-[var(--color-text-primary)]"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Functional High</label>
            <input
              type="number"
              step="any"
              value={newHigh}
              onChange={(e) => setNewHigh(e.target.value)}
              placeholder="Opt. highest value"
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] text-[var(--color-text-primary)]"
            />
          </div>
          <div className="md:col-span-1">
            <Button
              onClick={addOverride}
              disabled={saving || !newCode || !newName}
              className="w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
