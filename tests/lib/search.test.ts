import { describe, it, expect } from "vitest";
import { escapePostgrestPattern } from "@/lib/search";

describe("escapePostgrestPattern", () => {
  it("passes plain text through unchanged", () => {
    expect(escapePostgrestPattern("John")).toBe("John");
    expect(escapePostgrestPattern("Smith")).toBe("Smith");
  });

  it("escapes percent signs", () => {
    expect(escapePostgrestPattern("100%")).toBe("100\\%");
  });

  it("escapes underscores", () => {
    expect(escapePostgrestPattern("first_name")).toBe("first\\_name");
  });

  it("escapes backslashes first to avoid double-escaping", () => {
    expect(escapePostgrestPattern("a\\b")).toBe("a\\\\b");
  });

  it("escapes combined special characters", () => {
    expect(escapePostgrestPattern("100% of_all\\data")).toBe(
      "100\\% of\\_all\\\\data"
    );
  });

  it("handles empty string", () => {
    expect(escapePostgrestPattern("")).toBe("");
  });
});
