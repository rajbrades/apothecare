import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/practitioners/partnerships
 * Returns all active partnerships with whether the current practitioner has access.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Get all active partnerships
    const { data: allPartnerships, error: pErr } = await supabase
      .from("partnerships")
      .select("id, slug, name, description")
      .eq("is_active", true)
      .order("name");

    if (pErr) return jsonError(pErr.message, 500);

    // Get this practitioner's granted partnerships
    const { data: granted } = await supabase
      .from("practitioner_partnerships")
      .select("partnership_id")
      .eq("practitioner_id", practitioner.id)
      .eq("is_active", true);

    const grantedIds = new Set((granted || []).map((g: { partnership_id: string }) => g.partnership_id));

    // Get document counts per partnership
    const { data: docCounts } = await supabase
      .from("evidence_documents")
      .select("partnership_id")
      .not("partnership_id", "is", null)
      .eq("status", "ready");

    const countByPartnership = new Map<string, number>();
    for (const d of docCounts || []) {
      const pid = (d as { partnership_id: string }).partnership_id;
      countByPartnership.set(pid, (countByPartnership.get(pid) || 0) + 1);
    }

    const partnerships = (allPartnerships || []).map((p: { id: string; slug: string; name: string; description: string | null }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      hasAccess: grantedIds.has(p.id),
      documentCount: countByPartnership.get(p.id) || 0,
    }));

    return NextResponse.json({ partnerships });
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : "Internal error", 500);
  }
}
