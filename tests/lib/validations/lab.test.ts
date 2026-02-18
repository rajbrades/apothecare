import { describe, it, expect } from "vitest";
import { uploadLabSchema, labListQuerySchema } from "@/lib/validations/lab";

describe("uploadLabSchema", () => {
  it("accepts minimal input with defaults", () => {
    const result = uploadLabSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lab_vendor).toBe("other");
      expect(result.data.test_type).toBe("other");
    }
  });

  it("accepts all valid lab vendors", () => {
    const vendors = [
      "quest", "labcorp", "diagnostic_solutions", "genova",
      "precision_analytical", "mosaic", "vibrant", "spectracell",
      "realtime_labs", "zrt", "other",
    ];
    for (const vendor of vendors) {
      const result = uploadLabSchema.safeParse({ lab_vendor: vendor });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid lab vendor", () => {
    const result = uploadLabSchema.safeParse({ lab_vendor: "unknown_lab" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid test types", () => {
    const types = [
      "blood_panel", "stool_analysis", "saliva_hormone", "urine_hormone",
      "organic_acids", "micronutrient", "genetic", "food_sensitivity",
      "mycotoxin", "environmental", "other",
    ];
    for (const type of types) {
      const result = uploadLabSchema.safeParse({ test_type: type });
      expect(result.success).toBe(true);
    }
  });

  it("validates patient_id as UUID when provided", () => {
    const result = uploadLabSchema.safeParse({
      patient_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid collection_date", () => {
    const result = uploadLabSchema.safeParse({
      collection_date: "2025-01-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid collection_date format", () => {
    const result = uploadLabSchema.safeParse({
      collection_date: "Jan 15 2025",
    });
    expect(result.success).toBe(false);
  });

  it("rejects test_name over 200 chars", () => {
    const result = uploadLabSchema.safeParse({
      test_name: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe("labListQuerySchema", () => {
  it("provides defaults", () => {
    const result = labListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces limit from string", () => {
    const result = labListQuerySchema.safeParse({ limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects limit over 100", () => {
    const result = labListQuerySchema.safeParse({ limit: "200" });
    expect(result.success).toBe(false);
  });

  it("filters by status", () => {
    const result = labListQuerySchema.safeParse({ status: "complete" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = labListQuerySchema.safeParse({ status: "done" });
    expect(result.success).toBe(false);
  });
});
