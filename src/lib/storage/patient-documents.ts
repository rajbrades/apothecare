import { createServiceClient } from "@/lib/supabase/server";
import { sanitizeFilename } from "@/lib/sanitize";

const BUCKET = "patient-documents";

/**
 * Build storage path for a patient document.
 * Format: {practitioner_id}/{patient_id}/{document_id}/{filename}
 */
export function buildStoragePath(
  practitionerId: string,
  patientId: string,
  documentId: string,
  fileName: string
): string {
  return `${practitionerId}/${patientId}/${documentId}/${sanitizeFilename(fileName)}`;
}

/**
 * Upload a file buffer to Supabase Storage.
 */
export async function uploadToStorage(
  storagePath: string,
  file: Buffer,
  contentType: string
) {
  const serviceClient = createServiceClient();
  const { error } = await serviceClient.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

/**
 * Download a file from Supabase Storage as a buffer.
 */
export async function downloadFromStorage(storagePath: string): Promise<Buffer> {
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient.storage
    .from(BUCKET)
    .download(storagePath);

  if (error || !data) throw new Error(`Storage download failed: ${error?.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a time-limited signed URL for viewing.
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) throw new Error(`Signed URL failed: ${error?.message}`);
  return data.signedUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFromStorage(storagePath: string) {
  const serviceClient = createServiceClient();
  const { error } = await serviceClient.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

/**
 * Delete all files under a storage prefix (e.g. "{practitioner_id}/" or "{practitioner_id}/{patient_id}/").
 * Best-effort — logs errors but does not throw.
 */
export async function deleteStoragePrefix(prefix: string): Promise<number> {
  const serviceClient = createServiceClient();
  let deleted = 0;

  try {
    const { data: files, error } = await serviceClient.storage
      .from(BUCKET)
      .list(prefix, { limit: 1000 });

    if (error || !files?.length) return 0;

    // Collect all file paths (may include folders — recurse one level)
    const paths: string[] = [];
    for (const file of files) {
      const fullPath = `${prefix}${file.name}`;
      if (file.id) {
        // It's a file
        paths.push(fullPath);
      } else {
        // It's a folder — list contents
        const { data: subFiles } = await serviceClient.storage
          .from(BUCKET)
          .list(fullPath, { limit: 1000 });
        if (subFiles) {
          for (const sub of subFiles) {
            if (sub.id) paths.push(`${fullPath}/${sub.name}`);
          }
        }
      }
    }

    if (paths.length > 0) {
      const { error: rmError } = await serviceClient.storage
        .from(BUCKET)
        .remove(paths);
      if (!rmError) deleted = paths.length;
      else console.warn(`[Storage] Failed to delete ${paths.length} files under ${prefix}:`, rmError.message);
    }
  } catch (err) {
    console.warn("[Storage] Prefix cleanup error:", err);
  }

  return deleted;
}
