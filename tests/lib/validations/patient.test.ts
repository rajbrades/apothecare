import { describe, it, expect } from "vitest";
import { createPatientSchema, patientListQuerySchema } from "@/lib/validations/patient";

describe("createPatientSchema", () => {
  it("accepts minimal (empty) input", () => {
    const result = createPatientSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts full valid input", () => {
    const result = createPatientSchema.safeParse({
      first_name: "Jane",
      last_name: "Doe",
      date_of_birth: "1990-01-15",
      sex: "female",
      chief_complaints: ["fatigue", "brain fog"],
      medical_history: "Type 2 diabetes",
      current_medications: "Metformin 500mg",
      supplements: "Vitamin D 5000IU",
      allergies: ["penicillin"],
      notes: "New patient",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid sex value", () => {
    const result = createPatientSchema.safeParse({ sex: "unknown" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date_of_birth format", () => {
    const result = createPatientSchema.safeParse({
      date_of_birth: "January 15, 1990",
    });
    expect(result.success).toBe(false);
  });

  it("rejects first_name over 100 chars", () => {
    const result = createPatientSchema.safeParse({
      first_name: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many chief_complaints (>20)", () => {
    const result = createPatientSchema.safeParse({
      chief_complaints: Array(21).fill("complaint"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects medical_history over 10000 chars", () => {
    const result = createPatientSchema.safeParse({
      medical_history: "x".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts null values for optional fields", () => {
    const result = createPatientSchema.safeParse({
      first_name: null,
      last_name: null,
      sex: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("patientListQuerySchema", () => {
  it("provides defaults", () => {
    const result = patientListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.archived).toBe(false);
    }
  });

  it("coerces limit from string", () => {
    const result = patientListQuerySchema.safeParse({ limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects limit over 50", () => {
    const result = patientListQuerySchema.safeParse({ limit: "100" });
    expect(result.success).toBe(false);
  });
});
