/**
 * Escape special characters in a PostgREST LIKE/ILIKE pattern.
 *
 * PostgREST uses PostgreSQL LIKE syntax where:
 * - % matches any sequence of characters
 * - _ matches any single character
 * - \ is the escape character
 *
 * Order matters: escape backslashes first to avoid double-escaping.
 */
export function escapePostgrestPattern(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}
