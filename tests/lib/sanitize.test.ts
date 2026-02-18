import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "@/lib/sanitize";

describe("sanitizeFilename", () => {
  it("passes through normal filenames unchanged", () => {
    expect(sanitizeFilename("report.pdf")).toBe("report.pdf");
    expect(sanitizeFilename("my-file_v2.pdf")).toBe("my-file_v2.pdf");
  });

  it("strips path traversal sequences", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("etcpasswd");
    expect(sanitizeFilename("..file..name.pdf")).toBe("filename.pdf");
  });

  it("strips path separators", () => {
    expect(sanitizeFilename("foo/bar\\baz.pdf")).toBe("foobarbaz.pdf");
  });

  it("replaces special characters with underscores", () => {
    expect(sanitizeFilename("my file (1).pdf")).toBe("my file_1_.pdf");
    expect(sanitizeFilename("report@#$.pdf")).toBe("report_.pdf");
  });

  it("collapses consecutive underscores", () => {
    expect(sanitizeFilename("a___b.pdf")).toBe("a_b.pdf");
  });

  it("falls back to 'file' when name would be empty", () => {
    expect(sanitizeFilename("../..")).toBe("file");
    expect(sanitizeFilename("...pdf")).toBe("file.pdf");
  });

  it("preserves file extension", () => {
    expect(sanitizeFilename("test.PDF")).toBe("test.PDF");
    expect(sanitizeFilename("archive.tar.gz")).toMatch(/\.gz$/);
  });

  it("truncates long basenames to 200 characters", () => {
    const longName = "a".repeat(300) + ".pdf";
    const result = sanitizeFilename(longName);
    const basename = result.replace(".pdf", "");
    expect(basename.length).toBe(200);
    expect(result).toMatch(/\.pdf$/);
  });

  it("strips null bytes", () => {
    expect(sanitizeFilename("file\0name.pdf")).toBe("filename.pdf");
  });

  it("cleans special characters from extension", () => {
    expect(sanitizeFilename("report.p%df")).toBe("report.pdf");
  });

  it("handles files with no extension", () => {
    expect(sanitizeFilename("README")).toBe("README");
    expect(sanitizeFilename("../README")).toBe("README");
  });
});
