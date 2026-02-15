import {
  uploadToStorage,
  downloadFromStorage,
  getSignedUrl,
  deleteFromStorage,
} from "@/lib/storage/patient-documents";
import { sanitizeFilename } from "@/lib/sanitize";

/**
 * Build storage path for a lab report PDF.
 * Format: {practitioner_id}/labs/{report_id}/{filename}
 */
export function buildLabStoragePath(
  practitionerId: string,
  reportId: string,
  fileName: string
): string {
  return `${practitionerId}/labs/${reportId}/${sanitizeFilename(fileName)}`;
}

// Re-export storage helpers (they work with any path in the same bucket)
export {
  uploadToStorage,
  downloadFromStorage,
  getSignedUrl,
  deleteFromStorage,
};
