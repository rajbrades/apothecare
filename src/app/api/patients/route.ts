import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createPatientSchema, patientListQuerySchema } from "@/lib/validations/patient";
import { validateCsrf } from "@/lib/api/csrf";
import { escapePostgrestPattern } from "@/lib/search";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/patients — List patients with pagination & search ──────────
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
    const parsed = patientListQuerySchema.safeParse(params);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { cursor, limit, search, archived } = parsed.data;

    let query = supabase
      .from("patients")
      .select("id, first_name, last_name, date_of_birth, sex, chief_complaints, notes, is_archived, created_at, updated_at")
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", archived)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (cursor) query = query.lt("updated_at", cursor);
    if (search) {
      const escaped = escapePostgrestPattern(search);
      query = query.or(`first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%`);
    }

    const { data: patients, error } = await query;
    if (error) return jsonError("Failed to fetch patients", 500);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "patient",
      detail: { list: true, count: patients?.length || 0, search: search || null },
    });

    const nextCursor = patients && patients.length === limit
      ? patients[patients.length - 1].updated_at
      : null;

    return NextResponse.json({ patients: patients || [], nextCursor });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/patients — Create a new patient ───────────────────────────
export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

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
    const parsed = createPatientSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { data: patient, error } = await supabase
      .from("patients")
      .insert({
        practitioner_id: practitioner.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) return jsonError("Failed to create patient", 500);

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await serviceClient.from("audit_logs").insert({
      practitioner_id: practitioner.id,
      action: "create",
      resource_type: "patient",
      resource_id: patient.id,
      ip_address: clientIp,
      user_agent: userAgent,
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
