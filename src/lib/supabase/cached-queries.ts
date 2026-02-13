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
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();
  return practitioner;
});

export const getSidebarData = cache(async (practitionerId: string) => {
  const supabase = await createClient();
  const [{ data: recentConversations }, { data: recentVisits }] =
    await Promise.all([
      supabase
        .from("conversations")
        .select("id, title, updated_at")
        .eq("practitioner_id", practitionerId)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("visits")
        .select("id, visit_date, chief_complaint")
        .eq("practitioner_id", practitionerId)
        .eq("is_archived", false)
        .order("visit_date", { ascending: false })
        .limit(3),
    ]);

  return {
    recentConversations: recentConversations || [],
    recentVisits: recentVisits || [],
  };
});
