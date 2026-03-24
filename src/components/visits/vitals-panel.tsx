"use client";

import { useState, useRef, useCallback } from "react";
import { Check, Weight, Activity, Heart, Moon, Zap, Dumbbell, Leaf, Waves, Battery, Smile, Droplets, Save, Loader2, User, AlertTriangle, CheckCircle2, X, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { EditableTextSection, EditableTagSection } from "@/components/ui/editable-sections";
import type { VitalsData, HealthRatings } from "@/types/database";

interface PatientContext {
  id: string;
  chief_complaints: string[] | null;
  medical_history: string | null;
  current_medications: string | null;
  allergies: string[] | null;
  notes: string | null;
}

interface VitalsPanelProps {
  visitId: string;
  initialVitals: VitalsData | null;
  initialRatings: HealthRatings | null;
  readOnly?: boolean;
  patientId?: string | null;
  patient?: PatientContext | null;
  previousVitals?: VitalsData | null;
  previousRatings?: HealthRatings | null;
  previousDate?: string | null;
  onPatientFieldSaved?: (field: string, value: unknown) => void;
  onPushToChart?: () => void;
  pushingToChart?: boolean;
  vitalsPushedAt?: string | null;
  onVitalsSaved?: (vitals: VitalsData | null, ratings: HealthRatings | null) => void;
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

function sliderCssColor(value: number | undefined): string {
  if (!value) return "#94a3b8"; // slate-400
  if (value <= 4) return "#dc2626"; // red-600
  if (value <= 7) return "#d97706"; // amber-600
  return "#059669"; // emerald-600
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

// ── Imperial conversion helpers ──────────────────────────────────────
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;
const CM_PER_INCH = 2.54;

function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 10) / 10;
}

function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { ft: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * CM_PER_INCH);
}

function formatPreviousDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VitalsPanel({ visitId, initialVitals, initialRatings, readOnly = false, patientId, patient, previousVitals, previousRatings, previousDate, onPatientFieldSaved, onPushToChart, pushingToChart, vitalsPushedAt, onVitalsSaved }: VitalsPanelProps) {
  const [vitals, setVitals] = useState<VitalsData>(initialVitals ?? {});
  const [ratings, setRatings] = useState<HealthRatings>(initialRatings ?? {});
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const savedTimer = useRef<NodeJS.Timeout | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Imperial display state for height (derived from metric storage)
  const initFtIn = initialVitals?.height_cm ? cmToFtIn(initialVitals.height_cm) : { ft: undefined as number | undefined, inches: undefined as number | undefined };
  const [heightFt, setHeightFt] = useState<number | undefined>(initFtIn.ft);
  const [heightIn, setHeightIn] = useState<number | undefined>(initFtIn.inches);

  // Carry-forward / verify mode
  const hasOwnData = (initialVitals && Object.keys(initialVitals).length > 0) ||
    (initialRatings && Object.keys(initialRatings).length > 0);
  const hasPrevious = !!(previousVitals || previousRatings);
  const carryForwardMode = !readOnly && !hasOwnData && hasPrevious && !bannerDismissed;
  const verifyMode = !readOnly && hasOwnData && hasPrevious && !bannerDismissed;

  const doSave = useCallback(
    async (nextVitals: VitalsData, nextRatings: HealthRatings) => {
      const vitalsPayload = Object.keys(nextVitals).length > 0 ? nextVitals : null;
      const ratingsPayload = Object.keys(nextRatings).length > 0 ? nextRatings : null;
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vitals_data: vitalsPayload,
          health_ratings: ratingsPayload,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      // Sync parent visit state so tab switches preserve the saved data
      onVitalsSaved?.(vitalsPayload, ratingsPayload);
      setDirty(false);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    },
    [visitId, onVitalsSaved]
  );

  const scheduleSave = useCallback(
    (nextVitals: VitalsData, nextRatings: HealthRatings) => {
      setDirty(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await doSave(nextVitals, nextRatings);
        } catch {
          // silent — user can retry via Save button
        }
      }, 800);
    },
    [doSave]
  );

  const handleManualSave = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setManualSaving(true);
    try {
      await doSave(vitals, ratings);
      toast.success("Vitals & health ratings saved");
    } catch {
      toast.error("Failed to save — please try again");
    } finally {
      setManualSaving(false);
    }
  }, [vitals, ratings, doSave]);

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

  // Weight in lbs → store as kg
  const updateWeightLbs = useCallback(
    (raw: string) => {
      const lbs = raw === "" ? undefined : parseFloat(raw);
      const next = { ...vitals };
      if (lbs === undefined) {
        delete next.weight_kg;
      } else {
        next.weight_kg = lbsToKg(lbs);
      }
      setVitals(next);
      scheduleSave(next, ratings);
    },
    [vitals, ratings, scheduleSave]
  );

  // Height in ft/in → store as cm
  const updateHeight = useCallback(
    (ft: number | undefined, inches: number | undefined) => {
      setHeightFt(ft);
      setHeightIn(inches);
      const next = { ...vitals };
      if (ft == null && inches == null) {
        delete next.height_cm;
      } else {
        next.height_cm = ftInToCm(ft ?? 0, inches ?? 0);
      }
      setVitals(next);
      scheduleSave(next, ratings);
    },
    [vitals, ratings, scheduleSave]
  );

  const handleConfirmAll = useCallback(() => {
    const mergedVitals: VitalsData = { ...(previousVitals ?? {}), ...vitals };
    const mergedRatings: HealthRatings = { ...(previousRatings ?? {}), ...ratings };
    // Clean undefined keys
    for (const k of Object.keys(mergedVitals) as (keyof VitalsData)[]) {
      if (mergedVitals[k] === undefined) delete mergedVitals[k];
    }
    for (const k of Object.keys(mergedRatings) as (keyof HealthRatings)[]) {
      if (mergedRatings[k] === undefined) delete mergedRatings[k];
    }
    // Sync height ft/in display state
    if (mergedVitals.height_cm) {
      const { ft, inches } = cmToFtIn(mergedVitals.height_cm);
      setHeightFt(ft);
      setHeightIn(inches);
    }
    setVitals(mergedVitals);
    setRatings(mergedRatings);
    setBannerDismissed(true);
    scheduleSave(mergedVitals, mergedRatings);
    toast.success("Previous vitals confirmed for this visit");
  }, [previousVitals, previousRatings, vitals, ratings, scheduleSave]);

  const computedBmi = bmi(vitals.weight_kg, vitals.height_cm);
  // Also compute BMI from previous values for carry-forward display
  const prevBmi = carryForwardMode ? bmi(previousVitals?.weight_kg, previousVitals?.height_cm) : null;

  // Imperial display values
  const weightLbs = vitals.weight_kg != null ? kgToLbs(vitals.weight_kg) : undefined;
  const prevWeightLbs = previousVitals?.weight_kg != null ? kgToLbs(previousVitals.weight_kg) : undefined;
  const prevFtIn = previousVitals?.height_cm ? cmToFtIn(previousVitals.height_cm) : null;

  const hasData = Object.keys(vitals).length > 0 || Object.keys(ratings).length > 0;

  // Helper: should a biometric input show ghost state?
  const isGhostVital = (key: keyof VitalsData) =>
    carryForwardMode && previousVitals?.[key] != null && vitals[key] == null;

  const ghostInputClass = "placeholder:text-amber-400/70 placeholder:italic";

  return (
    <div className="space-y-8">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className={`transition-opacity duration-500 ${saved ? "opacity-100" : "opacity-0"}`}>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Check className="w-3 h-3" /> Saved
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={handleManualSave}
              disabled={manualSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)] transition-colors disabled:opacity-50"
            >
              {manualSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </button>
          )}
          {patientId && hasData && onPushToChart && (
            <button
              onClick={onPushToChart}
              disabled={pushingToChart}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border transition-colors disabled:opacity-50 ${
                vitalsPushedAt
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "text-[var(--color-brand-600)] border-[var(--color-brand-200)] bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)]"
              }`}
            >
              {pushingToChart ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              {vitalsPushedAt ? "Update Patient Chart" : "Push to Patient Chart"}
            </button>
          )}
        </div>
      </div>

      {/* ── Carry-Forward Banner ── */}
      {carryForwardMode && previousDate && (
        <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Previous vitals from {formatPreviousDate(previousDate)}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Review and verify, or confirm all to carry forward.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleConfirmAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-[var(--radius-md)] transition-colors"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Confirm All
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Verify Banner ── */}
      {verifyMode && previousDate && (
        <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-blue-200 bg-blue-50 text-blue-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-500" />
          <p className="text-xs flex-1">
            Vitals on file — please verify any changes since {formatPreviousDate(previousDate)}.
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
                    {weightLbs != null ? `${weightLbs} lbs` : "—"}
                  </span>
                ) : (
                  <div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1100"
                        placeholder={isGhostVital("weight_kg") && prevWeightLbs != null ? String(prevWeightLbs) : "0.0"}
                        value={weightLbs ?? ""}
                        onChange={(e) => updateWeightLbs(e.target.value)}
                        className={`w-20 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)] ${isGhostVital("weight_kg") ? ghostInputClass : ""}`}
                      />
                      <span className="text-xs text-[var(--color-text-muted)]">lbs</span>
                    </div>
                    {isGhostVital("weight_kg") && (
                      <span className="text-[10px] text-amber-500 italic mt-0.5 block">prev</span>
                    )}
                  </div>
                )}
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="9"
                        placeholder={isGhostVital("height_cm") && prevFtIn ? String(prevFtIn.ft) : "5"}
                        value={heightFt ?? ""}
                        onChange={(e) => {
                          const ft = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                          updateHeight(ft, heightIn);
                        }}
                        className={`w-14 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)] ${isGhostVital("height_cm") ? ghostInputClass : ""}`}
                      />
                      <span className="text-xs text-[var(--color-text-muted)]">ft</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="11"
                        placeholder={isGhostVital("height_cm") && prevFtIn ? String(prevFtIn.inches) : "7"}
                        value={heightIn ?? ""}
                        onChange={(e) => {
                          const inches = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                          updateHeight(heightFt, inches);
                        }}
                        className={`w-14 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)] ${isGhostVital("height_cm") ? ghostInputClass : ""}`}
                      />
                      <span className="text-xs text-[var(--color-text-muted)]">in</span>
                    </div>
                    {isGhostVital("height_cm") && (
                      <span className="text-[10px] text-amber-500 italic mt-0.5 block">prev</span>
                    )}
                  </div>
                </div>
              )}
              {computedBmi && (
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${bmiColor(computedBmi)}`}>
                  BMI {computedBmi} · {bmiLabel(computedBmi)}
                </div>
              )}
              {!computedBmi && prevBmi && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-200 text-amber-500 bg-amber-50 italic">
                  BMI {prevBmi} · {bmiLabel(prevBmi)} (prev)
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
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="300"
                      placeholder={isGhostVital("bp_systolic") ? String(previousVitals!.bp_systolic) : "120"}
                      value={vitals.bp_systolic ?? ""}
                      onChange={(e) => updateVital("bp_systolic", e.target.value)}
                      className={`w-16 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)] ${isGhostVital("bp_systolic") ? ghostInputClass : ""}`}
                    />
                  </div>
                  <span className="text-[var(--color-text-muted)] font-medium">/</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="200"
                      placeholder={isGhostVital("bp_diastolic") ? String(previousVitals!.bp_diastolic) : "80"}
                      value={vitals.bp_diastolic ?? ""}
                      onChange={(e) => updateVital("bp_diastolic", e.target.value)}
                      className={`w-16 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)] ${isGhostVital("bp_diastolic") ? ghostInputClass : ""}`}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">mmHg</span>
                </div>
                {(isGhostVital("bp_systolic") || isGhostVital("bp_diastolic")) && (
                  <span className="text-[10px] text-amber-500 italic mt-1 block">prev</span>
                )}
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
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="300"
                      placeholder={isGhostVital("heart_rate_bpm") ? String(previousVitals!.heart_rate_bpm) : "72"}
                      value={vitals.heart_rate_bpm ?? ""}
                      onChange={(e) => updateVital("heart_rate_bpm", e.target.value)}
                      className={`w-20 px-2 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-400)] ${isGhostVital("heart_rate_bpm") ? ghostInputClass : ""}`}
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">bpm</span>
                  </div>
                </div>
                {isGhostVital("heart_rate_bpm") && (
                  <span className="text-[10px] text-amber-500 italic mt-1 block">prev</span>
                )}
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
            const prevVal = previousRatings?.[key];
            const isGhost = val == null && prevVal != null && carryForwardMode;
            const displayVal = val ?? (isGhost ? prevVal : undefined);

            return (
              <div key={key} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <Icon className={`w-4 h-4 ${isGhost ? "text-amber-300" : "text-[var(--color-text-muted)]"}`} />
                  <span className={`text-sm ${isGhost ? "text-amber-400 italic" : "text-[var(--color-text-secondary)]"}`}>
                    {label}
                  </span>
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
                      value={displayVal ?? 5}
                      onChange={(e) => updateRating(key, parseInt(e.target.value, 10))}
                      title={description}
                      className="pillar-slider flex-1"
                      style={{
                        "--slider-color": isGhost ? "#d97706" : sliderCssColor(val),
                        "--slider-pct": displayVal != null ? `${((displayVal - 1) / 9) * 100}%` : "0%",
                        opacity: isGhost ? 0.5 : 1,
                      } as React.CSSProperties}
                    />
                    <span className={`text-sm font-semibold w-5 text-right tabular-nums ${
                      isGhost ? "text-amber-400 italic" : ratingColor(val)
                    }`}>
                      {isGhost ? prevVal : (val ?? "·")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Patient Context ── */}
      {patient && patientId && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-[var(--color-brand-600)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Patient History</h2>
          </div>

          <EditableTagSection
            title="Chief Complaints"
            values={patient.chief_complaints}
            patientId={patientId}
            fieldName="chief_complaints"
            onSaved={(field, value) => onPatientFieldSaved?.(field, value)}
            readOnly={readOnly}
          />
          <EditableTextSection
            title="Medical History"
            value={patient.medical_history}
            patientId={patientId}
            fieldName="medical_history"
            onSaved={(field, value) => onPatientFieldSaved?.(field, value)}
            readOnly={readOnly}
          />
          <EditableTextSection
            title="Current Medications"
            value={patient.current_medications}
            patientId={patientId}
            fieldName="current_medications"
            onSaved={(field, value) => onPatientFieldSaved?.(field, value)}
            readOnly={readOnly}
          />
          <EditableTagSection
            title="Allergies"
            values={patient.allergies}
            patientId={patientId}
            fieldName="allergies"
            onSaved={(field, value) => onPatientFieldSaved?.(field, value)}
            tagColor="red"
            readOnly={readOnly}
          />
          <EditableTextSection
            title="Notes"
            value={patient.notes}
            patientId={patientId}
            fieldName="notes"
            onSaved={(field, value) => onPatientFieldSaved?.(field, value)}
            readOnly={readOnly}
          />
        </section>
      )}
    </div>
  );
}
