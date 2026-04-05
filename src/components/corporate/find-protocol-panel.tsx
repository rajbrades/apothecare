"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ChevronRight, Syringe, Pill, Activity, Sparkles, User } from "lucide-react";
import type { ProtocolMatch } from "@/types/corporate-protocol";

interface FindProtocolPanelProps {
  /** Pre-fill from patient chart */
  patientId?: string;
  patientSex?: "male" | "female";
  patientAge?: number;
  patientName?: string;
  /** Pre-filled lab values from biomarker_results */
  prefillLabs?: Record<string, number>;
  /** Callback when provider selects a protocol */
  onSelect?: (protocolId: string) => void;
  /** Show as compact inline panel vs full page */
  compact?: boolean;
}

const CONCERN_SUGGESTIONS = [
  "fertility", "anti-aging", "body composition", "recovery",
  "fatigue", "poor sleep", "tissue repair", "tendon injury",
  "post-surgical", "gut repair", "skin aging", "hair thinning",
  "gh decline", "testosterone",
];

const STEP_TYPE_ICON = {
  medication: Syringe,
  supplement: Pill,
  lifestyle: Activity,
  diet: Activity,
};

export function FindProtocolPanel({
  patientId,
  patientSex,
  patientAge,
  patientName,
  prefillLabs = {},
  onSelect,
  compact = false,
}: FindProtocolPanelProps) {
  const router = useRouter();
  const [sex, setSex] = useState<"male" | "female" | "">(patientSex ?? "");
  const [age, setAge] = useState(patientAge?.toString() ?? "");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [concernInput, setConcernInput] = useState("");
  const [totalT, setTotalT] = useState(prefillLabs.total_testosterone?.toString() ?? "");
  const [freeT, setFreeT] = useState(prefillLabs.free_testosterone?.toString() ?? "");
  const [fsh, setFsh] = useState(prefillLabs.fsh?.toString() ?? "");
  const [lh, setLh] = useState(prefillLabs.lh?.toString() ?? "");
  const [igf1, setIgf1] = useState(prefillLabs.igf1?.toString() ?? "");

  const [matches, setMatches] = useState<ProtocolMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const addConcern = useCallback((c: string) => {
    const trimmed = c.trim().toLowerCase();
    if (trimmed && !concerns.includes(trimmed)) {
      setConcerns((prev) => [...prev, trimmed]);
    }
    setConcernInput("");
  }, [concerns]);

  const removeConcern = useCallback((c: string) => {
    setConcerns((prev) => prev.filter((x) => x !== c));
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);

    const body: Record<string, unknown> = {};
    if (patientId) body.patient_id = patientId;
    if (sex) body.sex = sex;
    if (age) body.age = parseInt(age);
    if (concerns.length > 0) body.concerns = concerns;
    if (totalT) body.total_testosterone = parseFloat(totalT);
    if (freeT) body.free_testosterone = parseFloat(freeT);
    if (fsh) body.fsh = parseFloat(fsh);
    if (lh) body.lh = parseFloat(lh);
    if (igf1) body.igf1 = parseFloat(igf1);

    try {
      const res = await fetch("/api/corporate/protocols/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [patientId, sex, age, concerns, totalT, freeT, fsh, lh, igf1]);

  const inputClass =
    "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]";
  const labelClass = "text-xs font-medium text-[var(--color-text-secondary)] mb-1 block";

  return (
    <div className={compact ? "space-y-5" : "space-y-6"}>
      {/* Patient context banner */}
      {patientName && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] text-sm">
          <User className="w-4 h-4 text-[var(--color-brand-600)]" />
          <span className="text-[var(--color-brand-700)] font-medium">
            Finding protocols for {patientName}
          </span>
          {patientSex && <span className="text-[var(--color-brand-500)]">· {patientSex}</span>}
          {patientAge && <span className="text-[var(--color-brand-500)]">· {patientAge}y</span>}
        </div>
      )}

      {/* Demographics */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Sex</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as "male" | "female" | "")}
            className={inputClass}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Age</label>
          <input
            type="number"
            min="1"
            max="120"
            placeholder="e.g. 47"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Concerns */}
      <div>
        <label className={labelClass}>Clinical Concerns</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            placeholder="Type a concern and press Enter"
            value={concernInput}
            onChange={(e) => setConcernInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addConcern(concernInput);
              }
            }}
            className={inputClass}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {concerns.map((c) => (
            <button
              key={c}
              onClick={() => removeConcern(c)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              {c} ×
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {CONCERN_SUGGESTIONS.filter((s) => !concerns.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                onClick={() => addConcern(s)}
                className="px-2 py-0.5 text-[10px] rounded border border-[var(--color-border-light)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)] transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      </div>

      {/* Lab Values */}
      <div>
        <label className={labelClass}>
          Lab Values {patientId && <span className="text-[var(--color-text-muted)] font-normal">(auto-filled from chart)</span>}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Total T (ng/dL)", value: totalT, set: setTotalT, placeholder: "445" },
            { label: "Free T (pg/mL)", value: freeT, set: setFreeT, placeholder: "11" },
            { label: "FSH (mIU/mL)", value: fsh, set: setFsh, placeholder: "2" },
            { label: "LH (mIU/mL)", value: lh, set: setLh, placeholder: "5" },
            { label: "IGF-1 (ng/mL)", value: igf1, set: setIgf1, placeholder: "180" },
          ].map((field) => (
            <div key={field.label}>
              <span className="text-[10px] text-[var(--color-text-muted)] block mb-0.5">{field.label}</span>
              <input
                type="number"
                step="any"
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Matching...</>
        ) : (
          <><Search className="w-4 h-4" /> Find Matching Protocol</>
        )}
      </button>

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-6 text-sm text-[var(--color-text-muted)]">
              No matching protocols found. Try adjusting parameters or adding more lab values.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-500)]" />
                <span>{matches.length} protocol{matches.length !== 1 ? "s" : ""} matched</span>
              </div>
              {matches.map((match) => (
                <button
                  key={match.protocol.id}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(match.protocol.id);
                    } else {
                      router.push(`/protocols/${match.protocol.id}`);
                    }
                  }}
                  className="w-full text-left rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-700)]">
                      {match.protocol.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        match.score >= 80
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : match.score >= 50
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-50 text-gray-600 border border-gray-200"
                      }`}>
                        {match.score}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)]" />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed">
                    {match.justification}
                  </p>
                  {match.matched_rules.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--color-text-muted)]">Rule:</span>
                      {match.matched_rules.map((r) => (
                        <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
