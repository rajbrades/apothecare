import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createVisitSchema, visitListQuerySchema } from "@/lib/validations/visit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/visits — List visits with pagination & filters ─────────────
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

    // Parse query params
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = visitListQuerySchema.safeParse(params);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { cursor, limit, status, patient_id, search } = parsed.data;

    let query = supabase
      .from("visits")
      .select("id, visit_date, visit_type, status, chief_complaint, patient_id, raw_notes, created_at, updated_at, patients(first_name, last_name)")
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false)
      .order("visit_date", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);
    if (patient_id) query = query.eq("patient_id", patient_id);
    if (cursor) query = query.lt("visit_date", cursor);
    if (search) query = query.ilike("chief_complaint", `%${search}%`);

    const { data: visits, error } = await query;
    if (error) return jsonError("Failed to fetch visits", 500);

    // Build next cursor
    const nextCursor = visits && visits.length === limit
      ? visits[visits.length - 1].visit_date
      : null;

    return NextResponse.json({ visits: visits || [], nextCursor });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/visits — Create a new visit ───────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const body = await request.json();
    const parsed = createVisitSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { visit_type, patient_id, chief_complaint, visit_date } = parsed.data;

    const { data: visit, error } = await supabase
      .from("visits")
      .insert({
        practitioner_id: practitioner.id,
        patient_id: patient_id || null,
        visit_type,
        visit_date: visit_date || new Date().toISOString(),
        chief_complaint: chief_complaint || null,
        note_template: visit_type === "follow_up" ? "follow_up" : "soap",
        status: "draft",
      })
      .select()
      .single();

    if (error) return jsonError("Failed to create visit", 500);

    // Audit log
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await serviceClient.from("audit_logs").insert({
      practitioner_id: practitioner.id,
      action: "create",
      resource_type: "visit",
      resource_id: visit.id,
      ip_address: clientIp,
      user_agent: userAgent,
      detail: { visit_type, has_patient: !!patient_id },
    });

    return NextResponse.json({ visit }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
