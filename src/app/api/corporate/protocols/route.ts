import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { protocolListQuerySchema } from "@/lib/validations/corporate-protocol";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/corporate/protocols
 * List protocols for the provider's corporate org. Filterable by category.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();

    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Get provider's corporate membership(s)
    const { data: memberships } = await supabase
      .from("corporate_provider_memberships")
      .select("corporate_id")
      .eq("practitioner_id", practitioner.id)
      .eq("is_active", true);

    const corporateIds = (memberships || []).map((m: { corporate_id: string }) => m.corporate_id);

    if (corporateIds.length === 0) {
      return NextResponse.json({ protocols: [], corporate: null });
    }

    // Parse query params
    const url = new URL(request.url);
    const parsed = protocolListQuerySchema.safeParse({
      category: url.searchParams.get("category") || undefined,
      search: url.searchParams.get("search") || undefined,
    });
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    // Fetch protocols with steps count
    let query = supabase
      .from("corporate_protocols")
      .select("*, corporate_accounts(name, slug, logo_url)")
      .in("corporate_id", corporateIds)
      .eq("status", "active")
      .order("category")
      .order("title");

    if (parsed.data.category) {
      query = query.eq("category", parsed.data.category);
    }
    if (parsed.data.search) {
      query = query.or(`title.ilike.%${parsed.data.search}%,description.ilike.%${parsed.data.search}%`);
    }

    const { data: protocols, error } = await query;
    if (error) return jsonError("Failed to fetch protocols", 500);

    // Get corporate account info
    const { data: corporate } = await supabase
      .from("corporate_accounts")
      .select("id, name, slug, logo_url, branding")
      .in("id", corporateIds)
      .single();

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "corporate_protocol",
      detail: { count: protocols?.length ?? 0 },
    });

    return NextResponse.json({ protocols: protocols || [], corporate });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
