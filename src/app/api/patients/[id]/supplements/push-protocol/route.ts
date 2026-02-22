import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { pushProtocolSchema } from "@/lib/validations/patient-supplement";
import type { PatientSupplement, ProtocolItem } from "@/types/database";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

/** Normalize a string for comparison. */
function norm(s: string | null | undefined): string {
  return s?.trim().toLowerCase() || "";
}

/** Check if dosage/form/timing differ between existing and protocol item. */
function hasChanges(existing: PatientSupplement, item: ProtocolItem): boolean {
  return (
    norm(existing.dosage) !== norm(item.dosage) ||
    norm(existing.form) !== norm(item.form) ||
    norm(existing.timing) !== norm(item.timing)
  );
}

/** Build notes from protocol item duration + rationale. */
function buildProtocolNotes(item: ProtocolItem): string | null {
  const parts: string[] = [];
  if (item.duration) parts.push(`Duration: ${item.duration}`);
  if (item.rationale) parts.push(item.rationale);
  return parts.join("\n\n").trim() || null;
}

// ── POST /api/patients/[id]/supplements/push-protocol ─────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId } = await params;
    const supabase = await createClient();
    const practitioner = await getAuthPractitioner(supabase);
    if (!practitioner) return jsonError("Unauthorized", 401);

    // Validate body
    const body = await request.json();
    const parsed = pushProtocolSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { visit_id } = parsed.data;

    // Fetch visit — verify ownership + patient match + has protocol
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .select("id, patient_id, practitioner_id, ai_protocol, visit_date")
      .eq("id", visit_id)
      .single();

    if (visitError || !visit) return jsonError("Visit not found", 404);
    if (visit.practitioner_id !== practitioner.id) return jsonError("Forbidden", 403);
    if (visit.patient_id !== patientId) return jsonError("Visit does not belong to this patient", 400);

    const protocol = visit.ai_protocol as { supplements?: ProtocolItem[] } | null;
    const supplements = protocol?.supplements;
    if (!supplements?.length) {
      return jsonError("Visit protocol has no supplement recommendations", 400);
    }

    // Fetch ALL existing patient supplements (including discontinued) for matching
    const { data: existing, error: existingError } = await supabase
      .from("patient_supplements")
      .select("*")
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id);

    if (existingError) return jsonError(existingError.message, 500);

    // Build case-insensitive lookup
    const lookup = new Map<string, PatientSupplement>();
    let maxSortOrder = 0;
    for (const sup of (existing || []) as PatientSupplement[]) {
      lookup.set(sup.name.trim().toLowerCase(), sup);
      if (sup.sort_order > maxSortOrder) maxSortOrder = sup.sort_order;
    }

    const results = { added: 0, updated: 0, unchanged: 0, total: 0 };
    const visitDate = visit.visit_date || new Date().toISOString();

    for (const item of supplements) {
      const key = item.name.trim().toLowerCase();
      const match = lookup.get(key);
      const notes = buildProtocolNotes(item);

      const updateFields: Record<string, unknown> = {
        visit_id,
        source: "protocol",
      };
      if (item.dosage) updateFields.dosage = item.dosage;
      if (item.form) updateFields.form = item.form;
      if (item.timing) updateFields.timing = item.timing;
      if (notes) updateFields.notes = notes;

      if (!match) {
        // New supplement — insert
        maxSortOrder += 1;
        const { error } = await supabase
          .from("patient_supplements")
          .insert({
            patient_id: patientId,
            practitioner_id: practitioner.id,
            name: item.name.trim(),
            status: "active",
            started_at: visitDate,
            sort_order: maxSortOrder,
            ...updateFields,
          });

        if (error) return jsonError(`Failed to insert ${item.name}: ${error.message}`, 500);

        results.added++;
      } else if (match.status === "discontinued") {
        // Reactivate discontinued supplement
        const { error } = await supabase
          .from("patient_supplements")
          .update({
            ...updateFields,
            status: "active",
            discontinued_at: null,
            started_at: visitDate,
          })
          .eq("id", match.id);

        if (error) return jsonError(`Failed to reactivate ${item.name}: ${error.message}`, 500);

        results.added++;
      } else if (hasChanges(match, item)) {
        // Update existing supplement with changed fields
        const { error } = await supabase
          .from("patient_supplements")
          .update(updateFields)
          .eq("id", match.id);

        if (error) return jsonError(`Failed to update ${item.name}: ${error.message}`, 500);

        results.updated++;
      } else {
        // No changes — skip
        results.unchanged++;
      }
    }

    results.total = supplements.length;

    // Mark visit as protocol-pushed
    await supabase
      .from("visits")
      .update({ protocol_pushed_at: new Date().toISOString() })
      .eq("id", visit_id);

    // Audit log (fire-and-forget)
    auditLog({
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "protocol_push",
      resourceId: visit_id,
      detail: { patient_id: patientId, results },
      request,
    });

    return NextResponse.json({ results });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
