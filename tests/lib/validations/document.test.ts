import { describe, it, expect } from "vitest";
import { uploadDocumentSchema, documentListQuerySchema } from "@/lib/validations/document";

describe("uploadDocumentSchema", () => {
  it("accepts minimal input with defaults", () => {
    const result = uploadDocumentSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.document_type).toBe("other");
    }
  });

  it("accepts all valid document types", () => {
    const types = [
      "intake_form", "health_history", "lab_report", "imaging",
      "referral", "consent", "insurance", "other",
    ];
    for (const type of types) {
      const result = uploadDocumentSchema.safeParse({ document_type: type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid document type", () => {
    const result = uploadDocumentSchema.safeParse({ document_type: "pdf" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = uploadDocumentSchema.safeParse({ title: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("validates document_date format", () => {
    expect(
      uploadDocumentSchema.safeParse({ document_date: "2025-01-15" }).success
    ).toBe(true);
    expect(
      uploadDocumentSchema.safeParse({ document_date: "bad-date" }).success
    ).toBe(false);
  });
});

describe("documentListQuerySchema", () => {
  it("provides defaults", () => {
    const result = documentListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("filters by document_type", () => {
    const result = documentListQuerySchema.safeParse({
      document_type: "intake_form",
    });
    expect(result.success).toBe(true);
  });

  it("rejects limit over 50", () => {
    const result = documentListQuerySchema.safeParse({ limit: "100" });
    expect(result.success).toBe(false);
  });
});
