import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { z } from "zod";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getCorporateAdmin(supabase: ReturnType<Awaited<ReturnType<typeof createClient>>["from"]> extends never ? never : Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!practitioner) return null;

  const { data: membership } = await supabase
    .from("corporate_provider_memberships")
    .select("corporate_id, role")
    .eq("practitioner_id", practitioner.id)
    .eq("role", "admin")
    .eq("is_active", true)
    .single();
  if (!membership) return null;

  return { practitioner, corporateId: membership.corporate_id };
}

const updateSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  category: z.enum(["trt", "hrt", "peptides", "metabolic", "thyroid", "gut", "neuro", "other"]).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  authored_by: z.string().max(200).nullable().optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

/**
 * PATCH /api/corporate/admin/protocols/[id]
 * Update protocol fields (title, description, category, status, tags).
 * Corporate admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const supabase = await createClient();
    const admin = await getCorporateAdmin(supabase);
    if (!admin) return jsonError("Unauthorized — corporate admin required", 403);

    // Verify protocol belongs to admin's org
    const { data: protocol } = await supabase
      .from("corporate_protocols")
      .select("id, corporate_id, status")
      .eq("id", id)
      .eq("corporate_id", admin.corporateId)
      .single();

    if (!protocol) return jsonError("Protocol not found", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { error } = await supabase
      .from("corporate_protocols")
      .update(parsed.data)
      .eq("id", id);

    if (error) return jsonError("Failed to update protocol", 500);

    auditLog({
      request,
      practitionerId: admin.practitioner.id,
      action: "update",
      resourceType: "corporate_protocol",
      resourceId: id,
      detail: { fields: Object.keys(parsed.data), previous_status: protocol.status },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE /api/corporate/admin/protocols/[id]
 * Permanently delete a draft protocol. Active protocols must be archived first.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const supabase = await createClient();
    const admin = await getCorporateAdmin(supabase);
    if (!admin) return jsonError("Unauthorized", 403);

    const { data: protocol } = await supabase
      .from("corporate_protocols")
      .select("id, status")
      .eq("id", id)
      .eq("corporate_id", admin.corporateId)
      .single();

    if (!protocol) return jsonError("Protocol not found", 404);
    if (protocol.status === "active") {
      return jsonError("Cannot delete an active protocol. Archive it first.", 409);
    }

    const { error } = await supabase
      .from("corporate_protocols")
      .delete()
      .eq("id", id);

    if (error) return jsonError("Failed to delete protocol", 500);

    auditLog({
      request,
      practitionerId: admin.practitioner.id,
      action: "delete",
      resourceType: "corporate_protocol",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
