import { describe, it, expect } from "vitest";
import { chatMessageSchema, chatHistoryQuerySchema } from "@/lib/validations/chat";

describe("chatMessageSchema", () => {
  it("accepts a valid message", () => {
    const result = chatMessageSchema.safeParse({ message: "Hello doctor" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = chatMessageSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message over 10000 chars", () => {
    const result = chatMessageSchema.safeParse({ message: "x".repeat(10001) });
    expect(result.success).toBe(false);
  });

  it("accepts optional conversation_id as valid UUID", () => {
    const result = chatMessageSchema.safeParse({
      message: "Hello",
      conversation_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid conversation_id", () => {
    const result = chatMessageSchema.safeParse({
      message: "Hello",
      conversation_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null conversation_id", () => {
    const result = chatMessageSchema.safeParse({
      message: "Hello",
      conversation_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("defaults is_deep_consult to false", () => {
    const result = chatMessageSchema.safeParse({ message: "Hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_deep_consult).toBe(false);
    }
  });
});

describe("chatHistoryQuerySchema", () => {
  it("accepts valid query", () => {
    const result = chatHistoryQuerySchema.safeParse({
      conversation_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50); // default
    }
  });

  it("rejects invalid conversation_id", () => {
    const result = chatHistoryQuerySchema.safeParse({
      conversation_id: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("coerces limit string to number", () => {
    const result = chatHistoryQuerySchema.safeParse({
      conversation_id: "550e8400-e29b-41d4-a716-446655440000",
      limit: "25",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it("rejects limit over 100", () => {
    const result = chatHistoryQuerySchema.safeParse({
      conversation_id: "550e8400-e29b-41d4-a716-446655440000",
      limit: "200",
    });
    expect(result.success).toBe(false);
  });
});
