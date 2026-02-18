import { describe, it, expect } from "vitest";
import {
  calculateBiomarkerFlag,
  calculateFlags,
  matchBiomarkerReference,
} from "@/lib/labs/normalize-biomarkers";

// ── calculateBiomarkerFlag ──────────────────────────────────────────

describe("calculateBiomarkerFlag", () => {
  it("returns 'normal' when no ranges provided", () => {
    expect(calculateBiomarkerFlag(100, null, null)).toBe("normal");
  });

  it("returns 'normal' for value within range", () => {
    expect(calculateBiomarkerFlag(50, 10, 100)).toBe("normal");
  });

  it("returns 'low' for value below low", () => {
    expect(calculateBiomarkerFlag(5, 10, 100)).toBe("low");
  });

  it("returns 'high' for value above high", () => {
    expect(calculateBiomarkerFlag(150, 10, 100)).toBe("high");
  });

  it("returns 'critical' for value far below low (<50%)", () => {
    expect(calculateBiomarkerFlag(3, 10, 100)).toBe("critical");
  });

  it("returns 'critical' for value far above high (>200%)", () => {
    expect(calculateBiomarkerFlag(250, 10, 100)).toBe("critical");
  });

  it("returns 'borderline_low' for value just above low (within 10%)", () => {
    // Range 10-100, borderline zone = (100-10)*0.1 = 9, so borderline_low < 19
    expect(calculateBiomarkerFlag(12, 10, 100)).toBe("borderline_low");
  });

  it("returns 'borderline_high' for value just below high (within 10%)", () => {
    // Range 10-100, borderline zone = (100-10)*0.1 = 9, so borderline_high > 91
    expect(calculateBiomarkerFlag(95, 10, 100)).toBe("borderline_high");
  });

  it("handles one-sided range (only low)", () => {
    expect(calculateBiomarkerFlag(5, 10, null)).toBe("low");
    expect(calculateBiomarkerFlag(15, 10, null)).toBe("normal");
  });

  it("handles one-sided range (only high)", () => {
    expect(calculateBiomarkerFlag(150, null, 100)).toBe("high");
    expect(calculateBiomarkerFlag(50, null, 100)).toBe("normal");
  });

  it("returns 'low' at exact boundary", () => {
    // value === low * 0.5 → not critical (strict <), falls through to low
    expect(calculateBiomarkerFlag(5, 10, 100)).toBe("low");
    expect(calculateBiomarkerFlag(9.9, 10, 100)).toBe("low");
    // value just below the 50% threshold IS critical
    expect(calculateBiomarkerFlag(4.9, 10, 100)).toBe("critical");
  });
});

// ── calculateFlags ──────────────────────────────────────────────────

describe("calculateFlags", () => {
  it("returns conventional and null functional when no functional ranges", () => {
    const result = calculateFlags(50, 10, 100, null, null);
    expect(result.conventional_flag).toBe("normal");
    expect(result.functional_flag).toBeNull();
  });

  it("upgrades to optimal when within functional range", () => {
    const result = calculateFlags(60, 10, 100, 50, 80);
    expect(result.conventional_flag).toBe("optimal");
    expect(result.functional_flag).toBe("optimal");
  });

  it("keeps conventional flag when outside functional range", () => {
    // Value 30 is within conventional (10-100) but below functional low (50)
    // 30 < 50 * 0.5 = 25 is false, so functional_flag = low (not critical)
    const result = calculateFlags(30, 10, 100, 50, 80);
    expect(result.conventional_flag).toBe("normal");
    expect(result.functional_flag).toBe("low");
  });

  it("handles value outside both ranges", () => {
    const result = calculateFlags(5, 10, 100, 50, 80);
    expect(result.conventional_flag).toBe("low");
    expect(result.functional_flag).toBe("critical");
  });
});

// ── matchBiomarkerReference ─────────────────────────────────────────

describe("matchBiomarkerReference", () => {
  const references = [
    {
      biomarker_code: "TSH",
      biomarker_name: "Thyroid Stimulating Hormone",
      category: "Thyroid",
      conventional_low: 0.4,
      conventional_high: 4.0,
      conventional_unit: "mIU/L",
      functional_low: 1.0,
      functional_high: 2.5,
    },
    {
      biomarker_code: "FREE_T3",
      biomarker_name: "Free T3",
      category: "Thyroid",
      conventional_low: 2.3,
      conventional_high: 4.2,
      conventional_unit: "pg/mL",
      functional_low: 3.0,
      functional_high: 4.0,
    },
    {
      biomarker_code: "VITAMIN_D_25OH",
      biomarker_name: "25-Hydroxyvitamin D",
      category: "Nutritional",
      conventional_low: 30,
      conventional_high: 100,
      conventional_unit: "ng/mL",
      functional_low: 50,
      functional_high: 80,
    },
  ];

  it("matches by exact code (Tier 1)", () => {
    const result = matchBiomarkerReference(
      { code: "TSH", name: "TSH", value: 2.0, unit: "mIU/L" },
      references
    );
    expect(result?.biomarker_code).toBe("TSH");
  });

  it("matches via alias map (Tier 2)", () => {
    // "FT3" → "FREE_T3" via alias map
    const result = matchBiomarkerReference(
      { code: "FT3", name: "Free Triiodothyronine", value: 3.0, unit: "pg/mL" },
      references
    );
    expect(result?.biomarker_code).toBe("FREE_T3");
  });

  it("matches by fuzzy name (Tier 3)", () => {
    const result = matchBiomarkerReference(
      { code: "VIT_D", name: "25-Hydroxyvitamin D", value: 45, unit: "ng/mL" },
      references
    );
    expect(result?.biomarker_code).toBe("VITAMIN_D_25OH");
  });

  it("matches alias for Vitamin D", () => {
    const result = matchBiomarkerReference(
      { code: "Vitamin D", name: "Vitamin D, 25-Hydroxy", value: 45, unit: "ng/mL" },
      references
    );
    expect(result?.biomarker_code).toBe("VITAMIN_D_25OH");
  });

  it("returns null when no match", () => {
    const result = matchBiomarkerReference(
      { code: "UNKNOWN_MARKER", name: "Something Random", value: 1, unit: "mg/dL" },
      references
    );
    expect(result).toBeNull();
  });

  it("handles case-insensitive matching", () => {
    const result = matchBiomarkerReference(
      { code: "tsh", name: "tsh", value: 2.0, unit: "mIU/L" },
      references
    );
    expect(result?.biomarker_code).toBe("TSH");
  });
});
