import { describe, it, expect } from "vitest";
import {
  createVisitSchema,
  updateVisitSchema,
  generateVisitSchema,
  visitListQuerySchema,
} from "@/lib/validations/visit";

describe("createVisitSchema", () => {
  it("accepts minimal input with defaults", () => {
    const result = createVisitSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visit_type).toBe("soap");
    }
  });

  it("accepts all valid visit types", () => {
    for (const type of ["soap", "follow_up", "history_physical", "consult"]) {
      const result = createVisitSchema.safeParse({ visit_type: type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid visit type", () => {
    const result = createVisitSchema.safeParse({ visit_type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects chief_complaint over 500 chars", () => {
    const result = createVisitSchema.safeParse({
      chief_complaint: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("validates patient_id as UUID", () => {
    const result = createVisitSchema.safeParse({
      patient_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateVisitSchema", () => {
  it("accepts partial fields", () => {
    const result = updateVisitSchema.safeParse({
      subjective: "Patient reports fatigue",
    });
    expect(result.success).toBe(true);
  });

  it("rejects raw_notes over 50000 chars", () => {
    const result = updateVisitSchema.safeParse({
      raw_notes: "x".repeat(50001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts status transitions", () => {
    expect(
      updateVisitSchema.safeParse({ status: "completed" }).success
    ).toBe(true);
    expect(
      updateVisitSchema.safeParse({ status: "draft" }).success
    ).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(
      updateVisitSchema.safeParse({ status: "pending" }).success
    ).toBe(false);
  });
});

describe("generateVisitSchema", () => {
  it("accepts valid raw_notes", () => {
    const result = generateVisitSchema.safeParse({
      raw_notes: "Patient presents with chronic fatigue and brain fog",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sections).toEqual(["soap", "ifm_matrix", "protocol"]);
    }
  });

  it("rejects notes under 10 characters", () => {
    const result = generateVisitSchema.safeParse({
      raw_notes: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes over 50000 chars", () => {
    const result = generateVisitSchema.safeParse({
      raw_notes: "x".repeat(50001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts custom section selection", () => {
    const result = generateVisitSchema.safeParse({
      raw_notes: "Patient presents with chronic fatigue",
      sections: ["soap"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sections).toEqual(["soap"]);
    }
  });
});

describe("visitListQuerySchema", () => {
  it("provides defaults", () => {
    const result = visitListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("filters by status", () => {
    const result = visitListQuerySchema.safeParse({ status: "draft" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = visitListQuerySchema.safeParse({ status: "pending" });
    expect(result.success).toBe(false);
  });
});
