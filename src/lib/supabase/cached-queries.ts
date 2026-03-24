import { cache } from "react";
import { createClient } from "./server";

/**
 * Cached server-side queries for sidebar and layout data.
 *
 * React `cache()` deduplicates calls within a single server render pass,
 * so multiple server components in the same request share one result
 * without extra database round-trips.
 */

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getPractitioner = cache(async (authUserId: string) => {
  const supabase = await createClient();
  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id, full_name, email, subscription_tier, subscription_status, daily_query_count, daily_query_reset_at, default_note_template, verification_status, practice_name, specialty_focus, preferred_evidence_sources")
    .eq("auth_user_id", authUserId)
    .single();
  return practitioner;
});

export const getSidebarData = cache(async (practitionerId: string) => {
  const supabase = await createClient();
  const [{ data: recentConversations }, { data: favoriteConversations }, { data: recentVisits }] =
    await Promise.all([
      supabase
        .from("conversations")
        .select("id, title, updated_at")
        .eq("practitioner_id", practitionerId)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("conversations")
        .select("id, title, updated_at")
        .eq("practitioner_id", practitionerId)
        .eq("is_favorited", true)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("visits")
        .select("id, visit_date, visit_type, chief_complaint, patients(first_name, last_name)")
        .eq("practitioner_id", practitionerId)
        .eq("is_archived", false)
        .order("visit_date", { ascending: false })
        .limit(5),
    ]);

  return {
    recentConversations: recentConversations || [],
    favoriteConversations: favoriteConversations || [],
    recentVisits: recentVisits || [],
  };
});

export const getFullPractitioner = cache(async (authUserId: string) => {
  const supabase = await createClient();
  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();
  return practitioner;
});

export const getPatientWithDocuments = cache(async (practitionerId: string, patientId: string) => {
  const supabase = await createClient();
  const [{ data: patient }, { data: documents }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, practitioner_id, first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies, notes, clinical_summary, is_archived, created_at, updated_at")
      .eq("id", patientId)
      .eq("practitioner_id", practitionerId)
      .single(),
    supabase
      .from("patient_documents")
      .select("id, file_name, file_size, document_type, title, status, error_message, uploaded_at, extracted_at")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitionerId)
      .order("uploaded_at", { ascending: false }),
  ]);

  return { patient, documents: documents || [] };
});

export const getActivePartnerships = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partnerships")
    .select("slug, name, description, logo_url")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
});

export const getPractitionerPartnerships = cache(async (practitionerId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioner_partnerships")
    .select("partnership_id, is_active, partnerships(slug, name, description, logo_url)")
    .eq("practitioner_id", practitionerId)
    .eq("is_active", true);
  return data ?? [];
});

export const getPatientCount = cache(async (practitionerId: string) => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("practitioner_id", practitionerId)
    .eq("is_archived", false);

  return count || 0;
});
