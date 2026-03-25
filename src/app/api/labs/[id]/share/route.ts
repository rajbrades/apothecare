import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const schema = z.object({
  shared: z.boolean(),
});

/**
 * PATCH /api/labs/[id]/share
 * Toggle is_shared_with_patient on a lab report.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("shared (boolean) is required", 400);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) return jsonError("Unauthorized", 401);

  const { error } = await supabase
    .from("lab_reports")
    .update({ is_shared_with_patient: parsed.data.shared })
    .eq("id", id)
    .eq("practitioner_id", practitioner.id);

  if (error) return jsonError("Internal server error", 500);

  return NextResponse.json({ shared: parsed.data.shared });
}
