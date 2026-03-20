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

  // CBC
  HEMOGLOBIN: "HGB",
  RED_BLOOD_CELL_COUNT: "RBC",
  RED_BLOOD_CELLS: "RBC",
  WHITE_BLOOD_CELL_COUNT: "WBC",
  WHITE_BLOOD_CELLS: "WBC",
  HEMATOCRIT: "HCT",
  MEAN_CORPUSCULAR_VOLUME: "MCV",
  PLATELET_COUNT: "PLT",
  PLATELETS: "PLT",

  // Lipid
  CHOLESTEROL_TOTAL: "TOTAL_CHOLESTEROL",
  TOTAL_CHOL: "TOTAL_CHOLESTEROL",
  CHOL_TOTAL: "TOTAL_CHOLESTEROL",
  LDL_CHOLESTEROL: "LDL",
  LDL_CHOL: "LDL",
  HDL_CHOLESTEROL: "HDL",
  HDL_CHOL: "HDL",
  TRIG: "TRIGLYCERIDES",

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

  // Magnesium (serum)
  SERUM_MAGNESIUM: "MAGNESIUM",
  MG_SERUM: "MAGNESIUM",
  MAGNESIUM_SERUM: "MAGNESIUM",

  // Magnesium (RBC)
  RBC_MAGNESIUM: "MAGNESIUM_RBC",
  MAGNESIUM_RED_BLOOD_CELL: "MAGNESIUM_RBC",
  MG_RBC: "MAGNESIUM_RBC",

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

  // Tier 3: Fuzzy name match — exact first, then substring (prefer shortest ref name to avoid false positives)
  const normalizedName = normalizeCode(extracted.name);

  // 3a: Exact name match
  const exactNameMatch = references.find(
    (r) => normalizeCode(r.biomarker_name) === normalizedName
  );
  if (exactNameMatch) return exactNameMatch;

  // 3b: Substring match — score by closeness in length to avoid e.g. "Hemoglobin" matching "Hemoglobin A1c"
  const substringMatches = references.filter((r) => {
    const refName = normalizeCode(r.biomarker_name);
    return normalizedName.includes(refName) || refName.includes(normalizedName);
  });
  if (substringMatches.length > 0) {
    // Pick the reference whose name length is closest to the extracted name
    substringMatches.sort((a, b) => {
      const aDiff = Math.abs(normalizeCode(a.biomarker_name).length - normalizedName.length);
      const bDiff = Math.abs(normalizeCode(b.biomarker_name).length - normalizedName.length);
      return aDiff - bDiff;
    });
    return substringMatches[0];
  }

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

  // Borderline: within 10% of boundary (skip low-side when range starts at 0)
  if (low !== null && low > 0) {
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

  // Upgrade to "optimal" if within functional range (including borderline edges — the functional range IS the optimal zone)
  if (functional_flag === "normal" || functional_flag === "optimal"
    || functional_flag === "borderline_low" || functional_flag === "borderline_high") {
    return { conventional_flag: "optimal", functional_flag: "optimal" };
  }

  // Downgrade functional "out of range" to "borderline" if still within conventional range
  const conventionalIsNormal = conventional_flag === "normal" || conventional_flag === "optimal"
    || conventional_flag === "borderline_low" || conventional_flag === "borderline_high";

  if (functional_flag === "low" && conventionalIsNormal) {
    return { conventional_flag, functional_flag: "borderline_low" };
  }
  if (functional_flag === "high" && conventionalIsNormal) {
    return { conventional_flag, functional_flag: "borderline_high" };
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
  supabaseClient: SupabaseClient,
  practitionerId?: string
): Promise<NormalizationResult> {
  // Fetch all reference ranges
  const { data: references } = await supabaseClient
    .from("biomarker_references")
    .select("biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high");

  let refList: BiomarkerReferenceSlim[] = references || [];

  // If a practitioner ID is provided, fetch overrides
  if (practitionerId) {
    const { data: overrides } = await supabaseClient
      .from("practitioner_biomarker_ranges")
      .select("biomarker_code, biomarker_name, functional_low, functional_high")
      .eq("practitioner_id", practitionerId);

    if (overrides && overrides.length > 0) {
      // Create a map for fast lookup
      const overridemap = new Map(
        overrides.map((o) => [o.biomarker_code, o])
      );

      // Apply overrides to refList
      refList = refList.map((ref) => {
        const override = overridemap.get(ref.biomarker_code);
        if (override) {
          return {
            ...ref,
            functional_low: override.functional_low,
            functional_high: override.functional_high,
          };
        }
        return ref;
      });
      
      // We might want to add totally custom biomarker references if they don't exist
      // in the base list. Since they lack conventional ranges/units, they will just use functional.
      for (const override of overrides) {
        if (!refList.find(r => r.biomarker_code === override.biomarker_code)) {
            refList.push({
                biomarker_code: override.biomarker_code,
                biomarker_name: override.biomarker_name,
                category: "Custom",
                conventional_low: null,
                conventional_high: null,
                conventional_unit: "",
                functional_low: override.functional_low,
                functional_high: override.functional_high
            });
        }
      }
    }
  }

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
      subcategory: extracted.subcategory ?? null,
      value: extracted.value,
      unit: extracted.unit || reference?.conventional_unit || "",
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
