/**
 * Sanitize a filename for safe use in storage paths and database records.
 *
 * - Strips path separators (/ and \) and null bytes
 * - Removes path traversal sequences (..)
 * - Replaces non-alphanumeric characters (except . - _ and space) with underscores
 * - Collapses consecutive underscores/spaces
 * - Truncates basename to 200 characters
 * - Falls back to "file" if result would be empty
 */
export function sanitizeFilename(raw: string): string {
  // 1. Strip path separators and null bytes
  let name = raw.replace(/[/\\]/g, "").replace(/\0/g, "");

  // 2. Remove path traversal sequences
  name = name.replace(/\.\./g, "");

  // 3. Separate extension from basename
  const lastDot = name.lastIndexOf(".");
  let basename = lastDot > 0 ? name.slice(0, lastDot) : (lastDot === 0 ? "" : name);
  const ext = lastDot >= 0 ? name.slice(lastDot) : "";

  // 4. Replace special characters (keep alphanumeric, dash, underscore, space)
  basename = basename.replace(/[^a-zA-Z0-9\-_ ]/g, "_");

  // 5. Collapse consecutive underscores/spaces and trim
  basename = basename.replace(/[_ ]{2,}/g, "_").trim();

  // 6. Truncate basename to 200 characters
  if (basename.length > 200) {
    basename = basename.slice(0, 200);
  }

  // 7. Ensure non-empty
  if (!basename) {
    basename = "file";
  }

  // 8. Clean extension (only allow alphanumeric and dot)
  const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, "");

  return basename + cleanExt;
}
