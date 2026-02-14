import { createServiceClient } from "@/lib/supabase/server";

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
  return `${practitionerId}/${patientId}/${documentId}/${fileName}`;
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
