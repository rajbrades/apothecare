import type { BiomarkerFlag, BiomarkerReference } from "@/types/database";

type BiomarkerReferenceSlim = Pick<BiomarkerReference, "biomarker_code" | "biomarker_name" | "category" | "conventional_low" | "conventional_high" | "conventional_unit" | "functional_low" | "functional_high">;
import type { ExtractedBiomarker } from "@/lib/ai/lab-parsing-prompts";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Alias Map ─────────────────────────────────────────────────────────
// Maps common alternative names/codes to our canonical biomarker_code
const BIOMARKER_ALIASES: Record<string, string> = {
  // Thyroid
  FT3: "FREE_T3",
  FREE_TRIIODOTHYRONINE: "FREE_T3",
  FT4: "FREE_T4",
  FREE_THYROXINE: "FREE_T4",
  THYROID_PEROXIDASE_ANTIBODIES: "TPO_AB",
  TPO_ANTIBODIES: "TPO_AB",
  ANTI_TPO: "TPO_AB",
  THYROID_PEROXIDASE_AB: "TPO_AB",

  // Nutritional
  "25_OH_VITAMIN_D": "VITAMIN_D_25OH",
  "25_HYDROXY_VITAMIN_D": "VITAMIN_D_25OH",
  VITAMIN_D: "VITAMIN_D_25OH",
  VITAMIN_D_25_HYDROXY: "VITAMIN_D_25OH",

  // Metabolic
  A1C: "HBA1C",
  HEMOGLOBIN_A1C: "HBA1C",
  GLYCATED_HEMOGLOBIN: "HBA1C",
  INSULIN_FASTING: "FASTING_INSULIN",

  // Inflammation
  CRP_HS: "HS_CRP",
  HIGH_SENSITIVITY_CRP: "HS_CRP",
  C_REACTIVE_PROTEIN: "HS_CRP",
  CRP_HIGH_SENSITIVITY: "HS_CRP",

  // Iron
  SERUM_FERRITIN: "FERRITIN",

  // GI
  FECAL_CALPROTECTIN: "CALPROTECTIN",
  STOOL_CALPROTECTIN: "CALPROTECTIN",

  // Methylation
  PLASMA_HOMOCYSTEINE: "HOMOCYSTEINE",

  // Hormone
  DHEA_SULFATE: "DHEA_S",
  MORNING_CORTISOL: "CORTISOL_AM",
  AM_CORTISOL: "CORTISOL_AM",
  TESTOSTERONE_TOTAL: "TOTAL_TESTOSTERONE",

  // Magnesium
  RBC_MAGNESIUM: "MAGNESIUM_RBC",
  MAGNESIUM_RED_BLOOD_CELL: "MAGNESIUM_RBC",

  // Omega
  OMEGA_3_INDEX: "OMEGA_3_INDEX",
};

// ── Reference Matching ────────────────────────────────────────────────

function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * 3-tier matching: exact code → alias map → fuzzy name
 */
export function matchBiomarkerReference(
  extracted: ExtractedBiomarker,
  references: BiomarkerReferenceSlim[]
): BiomarkerReferenceSlim | null {
  const code = normalizeCode(extracted.code);

  // Tier 1: Exact code match
  const exactMatch = references.find(
    (r) => r.biomarker_code.toUpperCase() === code
  );
  if (exactMatch) return exactMatch;

  // Tier 2: Alias map
  const aliasCode = BIOMARKER_ALIASES[code];
  if (aliasCode) {
    const aliasMatch = references.find(
      (r) => r.biomarker_code.toUpperCase() === aliasCode.toUpperCase()
    );
    if (aliasMatch) return aliasMatch;
  }

  // Tier 3: Fuzzy name match
  const normalizedName = normalizeCode(extracted.name);
  const nameMatch = references.find((r) => {
    const refName = normalizeCode(r.biomarker_name);
    return refName === normalizedName || normalizedName.includes(refName) || refName.includes(normalizedName);
  });
  if (nameMatch) return nameMatch;

  return null;
}

// ── Flag Calculation ──────────────────────────────────────────────────

export function calculateBiomarkerFlag(
  value: number,
  low: number | null,
  high: number | null
): BiomarkerFlag {
  if (low === null && high === null) return "normal";

  // Critical thresholds: 50% below low or 200% above high
  if (low !== null && value < low * 0.5) return "critical";
  if (high !== null && value > high * 2.0) return "critical";

  // Out of range
  if (low !== null && value < low) return "low";
  if (high !== null && value > high) return "high";

  // Borderline: within 10% of boundary
  if (low !== null) {
    const borderlineZone = (high !== null ? high - low : low) * 0.1;
    if (value < low + borderlineZone) return "borderline_low";
  }
  if (high !== null) {
    const borderlineZone = (low !== null ? high - low : high) * 0.1;
    if (value > high - borderlineZone) return "borderline_high";
  }

  return "normal";
}

/**
 * Calculate both conventional and functional flags for a biomarker.
 */
export function calculateFlags(
  value: number,
  conventionalLow: number | null,
  conventionalHigh: number | null,
  functionalLow: number | null,
  functionalHigh: number | null
): { conventional_flag: BiomarkerFlag; functional_flag: BiomarkerFlag | null } {
  const conventional_flag = calculateBiomarkerFlag(value, conventionalLow, conventionalHigh);

  // Only calculate functional flag if functional ranges exist
  const functional_flag =
    functionalLow !== null || functionalHigh !== null
      ? calculateBiomarkerFlag(value, functionalLow, functionalHigh)
      : null;

  // Upgrade conventional flag to "optimal" if within functional range
  if (functional_flag === "normal" || functional_flag === "optimal") {
    return { conventional_flag: "optimal", functional_flag: "optimal" };
  }

  return { conventional_flag, functional_flag };
}

// ── Normalization Orchestrator ────────────────────────────────────────

export interface NormalizationResult {
  totalCount: number;
  matchedCount: number;
  flaggedCount: number;
}

/**
 * Normalize extracted biomarkers against reference ranges and insert results.
 */
export async function normalizeBiomarkers(
  extractedBiomarkers: ExtractedBiomarker[],
  labReportId: string,
  patientId: string | null,
  collectionDate: string | null,
  supabaseClient: SupabaseClient
): Promise<NormalizationResult> {
  // Fetch all reference ranges
  const { data: references } = await supabaseClient
    .from("biomarker_references")
    .select("biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high");

  const refList: BiomarkerReferenceSlim[] = references || [];

  const inserts = [];
  let matchedCount = 0;
  let flaggedCount = 0;

  for (const extracted of extractedBiomarkers) {
    // Skip non-numeric or invalid values
    if (typeof extracted.value !== "number" || isNaN(extracted.value)) continue;

    const reference = matchBiomarkerReference(extracted, refList);

    // Use reference ranges when available, fall back to lab-reported ranges
    const conventionalLow = reference?.conventional_low ?? extracted.reference_low;
    const conventionalHigh = reference?.conventional_high ?? extracted.reference_high;
    const functionalLow = reference?.functional_low ?? null;
    const functionalHigh = reference?.functional_high ?? null;

    if (reference) matchedCount++;

    const flags = calculateFlags(
      extracted.value,
      conventionalLow,
      conventionalHigh,
      functionalLow,
      functionalHigh
    );

    const isFlagged =
      flags.conventional_flag !== "optimal" &&
      flags.conventional_flag !== "normal";
    if (isFlagged) flaggedCount++;

    inserts.push({
      lab_report_id: labReportId,
      patient_id: patientId,
      biomarker_code: normalizeCode(extracted.code),
      biomarker_name: extracted.name,
      category: extracted.category || (reference?.category ?? null),
      value: extracted.value,
      unit: extracted.unit,
      conventional_low: conventionalLow,
      conventional_high: conventionalHigh,
      conventional_flag: flags.conventional_flag,
      functional_low: functionalLow,
      functional_high: functionalHigh,
      functional_flag: flags.functional_flag,
      collection_date: collectionDate,
    });
  }

  // Batch insert
  if (inserts.length > 0) {
    const { error } = await supabaseClient
      .from("biomarker_results")
      .insert(inserts);

    if (error) {
      throw new Error(`Failed to insert biomarker results: ${error.message}`);
    }
  }

  return {
    totalCount: inserts.length,
    matchedCount,
    flaggedCount,
  };
}
