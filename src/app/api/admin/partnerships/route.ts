import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/cached-queries";
import { env } from "@/lib/env";

function isAdmin(email: string): boolean {
  const admins = (env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/admin/partnerships — List all partnerships with document/practitioner counts
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return jsonError("Unauthorized", 401);
    }

    const supabase = createServiceClient();

    const { data: partnerships, error } = await supabase
      .from("partnerships")
      .select("id, slug, name, description, logo_url, is_active, created_at")
      .order("created_at", { ascending: true });

    if (error) return jsonError("Internal server error", 500);

    // Get document counts and practitioner counts per partnership
    const enriched = await Promise.all(
      (partnerships || []).map(async (p: { id: string; slug: string; name: string; description: string | null; logo_url: string | null; is_active: boolean; created_at: string }) => {
        const [{ count: docCount }, { count: practCount }] = await Promise.all([
          supabase
            .from("evidence_documents")
            .select("id", { count: "exact", head: true })
            .eq("partnership_id", p.id),
          supabase
            .from("practitioner_partnerships")
            .select("id", { count: "exact", head: true })
            .eq("partnership_id", p.id)
            .eq("is_active", true),
        ]);

        return {
          ...p,
          documentCount: docCount || 0,
          practitionerCount: practCount || 0,
        };
      })
    );

    return NextResponse.json({ partnerships: enriched });
  } catch (err: unknown) {
    return jsonError("Internal server error", 500);
  }
}

/**
 * POST /api/admin/partnerships — Create a new partnership
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return jsonError("name and slug are required", 400);
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("partnerships")
      .insert({ name, slug, description: description || null })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return jsonError("Partnership with this slug already exists", 409);
      return jsonError("Internal server error", 500);
    }

    return NextResponse.json({ partnership: data }, { status: 201 });
  } catch (err: unknown) {
    return jsonError("Internal server error", 500);
  }
}
