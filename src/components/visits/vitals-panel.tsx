"use client";

import { useState, useRef, useCallback } from "react";
import { Check, Weight, Activity, Heart, Moon, Zap, Dumbbell, Leaf, Waves, Battery, Smile, Droplets } from "lucide-react";
import type { VitalsData, HealthRatings } from "@/types/database";

interface VitalsPanelProps {
  visitId: string;
  initialVitals: VitalsData | null;
  initialRatings: HealthRatings | null;
  readOnly?: boolean;
}

const PILLARS: {
  key: keyof HealthRatings;
  label: string;
  icon: typeof Moon;
  description: string;
}[] = [
  { key: "sleep", label: "Sleep", icon: Moon, description: "Quality & duration of sleep" },
  { key: "stress", label: "Stress", icon: Zap, description: "Stress levels (1 = very stressed, 10 = no stress)" },
  { key: "movement", label: "Movement", icon: Dumbbell, description: "Physical activity & exercise" },
  { key: "nutrition", label: "Nutrition", icon: Leaf, description: "Diet quality & consistency" },
  { key: "digestion", label: "Digestion", icon: Waves, description: "Gut comfort & regularity" },
  { key: "energy", label: "Energy", icon: Battery, description: "Overall energy & vitality" },
  { key: "mood", label: "Mood", icon: Smile, description: "Emotional wellbeing & outlook" },
  { key: "hydration", label: "Hydration", icon: Droplets, description: "Daily water intake" },
];

function ratingColor(value: number | undefined): string {
  if (!value) return "text-[var(--color-text-muted)]";
  if (value <= 4) return "text-red-600";
  if (value <= 7) return "text-amber-600";
  return "text-emerald-600";
}

function ratingBg(value: number | undefined): string {
  if (!value) return "bg-[var(--color-border-light)]";
  if (value <= 4) return "bg-red-500";
  if (value <= 7) return "bg-amber-500";
  return "bg-emerald-500";
}

function bmi(weight_kg?: number, height_cm?: number): string | null {
  if (!weight_kg || !height_cm || height_cm === 0) return null;
  const h = height_cm / 100;
  const result = weight_kg / (h * h);
  return result.toFixed(1);
}

function bmiLabel(bmiVal: string): string {
  const n = parseFloat(bmiVal);
  if (n < 18.5) return "Underweight";
  if (n < 25) return "Normal";
  if (n < 30) return "Overweight";
  return "Obese";
}

function bmiColor(bmiVal: string): string {
  const n = parseFloat(bmiVal);
  if (n < 18.5) return "text-amber-600 bg-amber-50 border-amber-200";
  if (n < 25) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (n < 30) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export function VitalsPanel({ visitId, initialVitals, initialRatings, readOnly = false }: VitalsPanelProps) {
  const [vitals, setVitals] = useState<VitalsData>(initialVitals ?? {});
  const [ratings, setRatings] = useState<HealthRatings>(initialRatings ?? {});
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const savedTimer = useRef<NodeJS.Timeout | null>(null);

  const scheduleSave = useCallback(
    (nextVitals: VitalsData, nextRatings: HealthRatings) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await fetch(`/api/visits/${visitId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vitals_data: Object.keys(nextVitals).length > 0 ? nextVitals : null,
              health_ratings: Object.keys(nextRatings).length > 0 ? nextRatings : null,
            }),
          });
          setSaved(true);
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaved(false), 2500);
        } catch {
          // silent — user can retry
        }
      }, 800);
    },
    [visitId]
  );

  const updateVital = useCallback(
    (key: keyof VitalsData, raw: string) => {
      const val = raw === "" ? undefined : parseFloat(raw);
      const next = { ...vitals, [key]: val };
      if (val === undefined) delete next[key];
      setVitals(next);
      scheduleSave(next, ratings);
    },
    [vitals, ratings, scheduleSave]
  );

  const updateRating = useCallback(
    (key: keyof HealthRatings, val: number) => {
      const next = { ...ratings, [key]: val };
      setRatings(next);
      scheduleSave(vitals, next);
    },
    [vitals, ratings, scheduleSave]
  );

  const computedBmi = bmi(vitals.weight_kg, vitals.height_cm);

  return (
    <div className="space-y-8">
      {/* Saved indicator */}
      <div className={`flex justify-end transition-opacity duration-500 ${saved ? "opacity-100" : "opacity-0"}`}>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <Check className="w-3 h-3" /> Saved
        </span>
      </div>

      {/* ── Vitals ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[var(--color-brand-600)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Biometrics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Weight */}
          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface-raised)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Weight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">Weight & BMI</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {readOnly ? (
                  <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {vitals.weight_kg != null ? `${vitals.weight_kg} kg` : "—"}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="500"
                      placeholder="0.0"
                      value={vitals.weight_kg ?? ""}
                      onChange={(e) => updateVital("weight_kg", e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">kg</span>
                  </div>
                )}
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="300"
                      placeholder="170"
                      value={vitals.height_cm ?? ""}
                      onChange={(e) => updateVital("height_cm", e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">cm height</span>
                  </div>
                </div>
              )}
              {computedBmi && (
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${bmiColor(computedBmi)}`}>
                  BMI {computedBmi} · {bmiLabel(computedBmi)}
                </div>
              )}
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface-raised)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Heart className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">Blood Pressure</span>
            </div>
            {readOnly ? (
              <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                {vitals.bp_systolic != null && vitals.bp_diastolic != null
                  ? `${vitals.bp_systolic} / ${vitals.bp_diastolic} mmHg`
                  : "—"}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="300"
                    placeholder="120"
                    value={vitals.bp_systolic ?? ""}
                    onChange={(e) => updateVital("bp_systolic", e.target.value)}
                    className="w-16 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
                  />
                </div>
                <span className="text-[var(--color-text-muted)] font-medium">/</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="200"
                    placeholder="80"
                    value={vitals.bp_diastolic ?? ""}
                    onChange={(e) => updateVital("bp_diastolic", e.target.value)}
                    className="w-16 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
                  />
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">mmHg</span>
              </div>
            )}
            <p className="text-xs text-[var(--color-text-muted)] mt-2">Normal: 90–120 / 60–80</p>
          </div>

          {/* Heart Rate */}
          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface-raised)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Activity className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">Heart Rate</span>
            </div>
            {readOnly ? (
              <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                {vitals.heart_rate_bpm != null ? `${vitals.heart_rate_bpm} bpm` : "—"}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="300"
                    placeholder="72"
                    value={vitals.heart_rate_bpm ?? ""}
                    onChange={(e) => updateVital("heart_rate_bpm", e.target.value)}
                    className="w-20 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)]"
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">bpm</span>
                </div>
              </div>
            )}
            <p className="text-xs text-[var(--color-text-muted)] mt-2">Normal resting: 60–100 bpm</p>
          </div>
        </div>
      </section>

      {/* ── Pillars of Health ── */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Leaf className="w-4 h-4 text-[var(--color-brand-600)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Pillars of Health</h2>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Patient-reported ratings · 1 = very poor, 10 = excellent
        </p>

        <div className="space-y-3">
          {PILLARS.map(({ key, label, icon: Icon, description }) => {
            const val = ratings[key];
            return (
              <div key={key} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
                </div>

                {readOnly ? (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1 h-2 bg-[var(--color-border-light)] rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${ratingBg(val)}`}
                        style={{ width: val ? `${(val / 10) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className={`text-sm font-semibold w-5 text-right ${ratingColor(val)}`}>
                      {val ?? "—"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={val ?? 5}
                      onChange={(e) => updateRating(key, parseInt(e.target.value, 10))}
                      title={description}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[var(--color-brand-600)]"
                    />
                    <span className={`text-sm font-semibold w-5 text-right ${ratingColor(val)}`}>
                      {val ?? "·"}
                    </span>
                    {val == null && (
                      <button
                        onClick={() => updateRating(key, 5)}
                        className="text-xs text-[var(--color-brand-600)] hover:underline"
                      >
                        Set
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
