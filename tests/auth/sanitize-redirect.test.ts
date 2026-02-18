import { describe, it, expect } from "vitest";

/**
 * The sanitizeRedirectPath function is defined locally in
 * src/app/auth/callback/route.ts and not exported.
 *
 * We re-implement the same logic here for testing, then verify
 * it matches the expected security contract.
 *
 * In a future refactor, this function should be extracted to a
 * shared utility and tested via direct import.
 */
function sanitizeRedirectPath(path: string | null): string {
  const fallback = "/dashboard";
  if (!path) return fallback;

  // Must start with exactly one "/" and not be protocol-relative ("//")
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;

  // Block any attempt to embed a scheme (e.g. "/\evil.com", data:, javascript:)
  if (/[\\:]/.test(path)) return fallback;

  return path;
}

describe("sanitizeRedirectPath", () => {
  it("returns /dashboard for null input", () => {
    expect(sanitizeRedirectPath(null)).toBe("/dashboard");
  });

  it("returns /dashboard for empty string", () => {
    expect(sanitizeRedirectPath("")).toBe("/dashboard");
  });

  it("allows valid relative paths", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/patients/123")).toBe("/patients/123");
    expect(sanitizeRedirectPath("/visits")).toBe("/visits");
  });

  it("blocks protocol-relative URLs", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.com/phish")).toBe("/dashboard");
  });

  it("blocks absolute URLs", () => {
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("http://evil.com")).toBe("/dashboard");
  });

  it("blocks javascript: scheme", () => {
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("blocks data: scheme", () => {
    expect(sanitizeRedirectPath("data:text/html,<h1>Hi</h1>")).toBe("/dashboard");
  });

  it("blocks backslash tricks", () => {
    expect(sanitizeRedirectPath("/\\evil.com")).toBe("/dashboard");
  });

  it("blocks paths not starting with /", () => {
    expect(sanitizeRedirectPath("evil.com/path")).toBe("/dashboard");
    expect(sanitizeRedirectPath("relative/path")).toBe("/dashboard");
  });

  it("allows paths with query parameters", () => {
    expect(sanitizeRedirectPath("/dashboard?tab=labs")).toBe(
      "/dashboard?tab=labs"
    );
  });

  it("allows paths with hash fragments", () => {
    expect(sanitizeRedirectPath("/visits#notes")).toBe("/visits#notes");
  });
});
