import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateCsrf } from "@/lib/api/csrf";
import { NextRequest } from "next/server";

describe("validateCsrf", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.apotheca.com");
  });

  function makeRequest(origin?: string): NextRequest {
    const headers = new Headers();
    if (origin) headers.set("origin", origin);
    return new NextRequest("https://app.apotheca.com/api/test", {
      method: "POST",
      headers,
    });
  }

  it("returns null when no origin header (server-to-server)", () => {
    const result = validateCsrf(makeRequest());
    expect(result).toBeNull();
  });

  it("returns null for matching origin", () => {
    const result = validateCsrf(makeRequest("https://app.apotheca.com"));
    expect(result).toBeNull();
  });

  it("returns 403 for mismatched origin", () => {
    const result = validateCsrf(makeRequest("https://evil.com"));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("returns 403 for subdomain mismatch", () => {
    const result = validateCsrf(makeRequest("https://sub.apotheca.com"));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("defaults to localhost:3000 when env not set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    // When NEXT_PUBLIC_APP_URL is empty, new URL("") will throw,
    // so it falls back to "http://localhost:3000"
    const req = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: new Headers({ origin: "http://localhost:3000" }),
    });
    const result = validateCsrf(req);
    expect(result).toBeNull();
  });
});
