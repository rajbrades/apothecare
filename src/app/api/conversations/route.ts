import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { conversationListQuerySchema } from "@/lib/validations/conversation";
import { escapePostgrestPattern } from "@/lib/search";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/conversations — List conversations with pagination & search ──
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = conversationListQuerySchema.safeParse(params);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { cursor, limit, search, filter } = parsed.data;

    let query = supabase
      .from("conversations")
      .select("id, title, patient_id, is_favorited, is_archived, created_at, updated_at, patients(first_name, last_name)")
      .eq("practitioner_id", practitioner.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    // Apply filter
    if (filter === "active") {
      query = query.eq("is_archived", false);
    } else if (filter === "archived") {
      query = query.eq("is_archived", true);
    } else if (filter === "favorites") {
      query = query.eq("is_favorited", true).eq("is_archived", false);
    }

    if (cursor) query = query.lt("updated_at", cursor);
    if (search) {
      const escaped = escapePostgrestPattern(search);
      query = query.ilike("title", `%${escaped}%`);
    }

    const { data: conversations, error } = await query;
    if (error) return jsonError("Failed to fetch conversations", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "conversation",
      detail: { list: true, count: conversations?.length || 0, search: search || null, filter },
    });

    const nextCursor = conversations && conversations.length === limit
      ? conversations[conversations.length - 1].updated_at
      : null;

    return NextResponse.json({ conversations: conversations || [], nextCursor });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
