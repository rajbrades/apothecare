import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { pushReviewSchema } from "@/lib/validations/patient-supplement";
import type { PatientSupplement, SupplementReviewItem } from "@/types/database";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthPractitioner(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return practitioner;
}

/**
 * Build notes string from review item rationale + optional duration.
 */
function buildNotes(item: SupplementReviewItem): string | null {
  const parts: string[] = [];
  if (item.recommended_duration) parts.push(`Duration: ${item.recommended_duration}`);
  if (item.rationale) parts.push(item.rationale);
  const combined = parts.join("\n\n").trim();
  return combined || null;
}

// ── POST /api/patients/[id]/supplements/push-review ─────────────────

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
    const parsed = pushReviewSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || "Invalid input", 400);
    }

    const { review_id, action_overrides, field_overrides } = parsed.data;

    // Fetch review — verify ownership + patient match + status
    const { data: review, error: reviewError } = await supabase
      .from("supplement_reviews")
      .select("id, patient_id, practitioner_id, status, review_data")
      .eq("id", review_id)
      .single();

    if (reviewError || !review) return jsonError("Review not found", 404);
    if (review.practitioner_id !== practitioner.id) return jsonError("Forbidden", 403);
    if (review.patient_id !== patientId) return jsonError("Review does not belong to this patient", 400);
    if (review.status !== "complete") return jsonError("Review is not complete", 400);

    const reviewData = review.review_data;
    if (!reviewData || (!reviewData.items?.length && !reviewData.additions?.length)) {
      return jsonError("Review has no supplement data", 400);
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
    for (const sup of existing || []) {
      lookup.set(sup.name.trim().toLowerCase(), sup);
      if (sup.sort_order > maxSortOrder) maxSortOrder = sup.sort_order;
    }

    const results = { kept: 0, modified: 0, discontinued: 0, added: 0, total: 0 };
    const allItems = [...(reviewData.items || []), ...(reviewData.additions || [])];

    for (const rawItem of allItems) {
      // Apply practitioner overrides (case-insensitive name match)
      const overrideKey = rawItem.name.trim().toLowerCase();
      const item = action_overrides?.[overrideKey]
        ? { ...rawItem, action: action_overrides[overrideKey] }
        : rawItem;
      const key = item.name.trim().toLowerCase();
      const match = lookup.get(key);
      const notes = buildNotes(item);
      const fieldEdits = field_overrides?.[key];

      const updateFields: Record<string, unknown> = {
        review_id,
        source: "review",
      };

      // For "modify" items: use practitioner-edited fields if provided, else AI recommendations
      if (item.action === "modify" && fieldEdits) {
        if (fieldEdits.dosage !== undefined) updateFields.dosage = fieldEdits.dosage || null;
        else if (item.recommended_dosage) updateFields.dosage = item.recommended_dosage;
        if (fieldEdits.form !== undefined) updateFields.form = fieldEdits.form || null;
        else if (item.recommended_form) updateFields.form = item.recommended_form;
        if (fieldEdits.timing !== undefined) updateFields.timing = fieldEdits.timing || null;
        else if (item.recommended_timing) updateFields.timing = item.recommended_timing;
        if (fieldEdits.brand !== undefined) updateFields.brand = fieldEdits.brand || null;
        else if (item.recommended_brand) updateFields.brand = item.recommended_brand;
      } else {
        // Non-modify actions or no field edits: use AI recommendations directly
        if (item.recommended_dosage) updateFields.dosage = item.recommended_dosage;
        if (item.recommended_form) updateFields.form = item.recommended_form;
        if (item.recommended_timing) updateFields.timing = item.recommended_timing;
        if (item.recommended_brand) updateFields.brand = item.recommended_brand;
      }
      if (notes) updateFields.notes = notes;

      switch (item.action) {
        case "keep": {
          if (match) {
            const { error } = await supabase
              .from("patient_supplements")
              .update(updateFields)
              .eq("id", match.id);
            if (error) return jsonError(`Failed to update ${item.name}: ${error.message}`, 500);
          } else {
            maxSortOrder += 1;
            const { error } = await supabase
              .from("patient_supplements")
              .insert({
                patient_id: patientId,
                practitioner_id: practitioner.id,
                name: item.name.trim(),
                status: "active",
                sort_order: maxSortOrder,
                ...updateFields,
              });
            if (error) return jsonError(`Failed to insert ${item.name}: ${error.message}`, 500);
          }
          results.kept++;
          break;
        }

        case "modify": {
          if (match) {
            const { error } = await supabase
              .from("patient_supplements")
              .update({
                ...updateFields,
                status: "active",
                discontinued_at: null,
              })
              .eq("id", match.id);
            if (error) return jsonError(`Failed to update ${item.name}: ${error.message}`, 500);
          } else {
            maxSortOrder += 1;
            const { error } = await supabase
              .from("patient_supplements")
              .insert({
                patient_id: patientId,
                practitioner_id: practitioner.id,
                name: item.name.trim(),
                status: "active",
                sort_order: maxSortOrder,
                ...updateFields,
              });
            if (error) return jsonError(`Failed to insert ${item.name}: ${error.message}`, 500);
          }
          results.modified++;
          break;
        }

        case "discontinue": {
          if (match) {
            const { error } = await supabase
              .from("patient_supplements")
              .update({
                ...updateFields,
                status: "discontinued",
                discontinued_at: new Date().toISOString(),
              })
              .eq("id", match.id);
            if (error) return jsonError(`Failed to discontinue ${item.name}: ${error.message}`, 500);
          } else {
            // Edge case: supplement not in patient file, mark as discontinued anyway
            maxSortOrder += 1;
            const { error } = await supabase
              .from("patient_supplements")
              .insert({
                patient_id: patientId,
                practitioner_id: practitioner.id,
                name: item.name.trim(),
                status: "discontinued",
                discontinued_at: new Date().toISOString(),
                sort_order: maxSortOrder,
                ...updateFields,
              });
            if (error) return jsonError(`Failed to insert discontinued ${item.name}: ${error.message}`, 500);
          }
          results.discontinued++;
          break;
        }

        case "add": {
          if (match) {
            // Reactivate if previously discontinued
            const { error } = await supabase
              .from("patient_supplements")
              .update({
                ...updateFields,
                status: "active",
                discontinued_at: null,
                started_at: match.started_at || new Date().toISOString(),
              })
              .eq("id", match.id);
            if (error) return jsonError(`Failed to reactivate ${item.name}: ${error.message}`, 500);
          } else {
            maxSortOrder += 1;
            const { error } = await supabase
              .from("patient_supplements")
              .insert({
                patient_id: patientId,
                practitioner_id: practitioner.id,
                name: item.name.trim(),
                status: "active",
                started_at: new Date().toISOString(),
                sort_order: maxSortOrder,
                ...updateFields,
              });
            if (error) return jsonError(`Failed to insert ${item.name}: ${error.message}`, 500);
          }
          results.added++;
          break;
        }
      }
    }

    results.total = results.kept + results.modified + results.discontinued + results.added;

    // Mark review as pushed
    await supabase
      .from("supplement_reviews")
      .update({ pushed_at: new Date().toISOString() })
      .eq("id", review_id);

    // Audit log
    auditLog({
      practitionerId: practitioner.id,
      action: "create",
      resourceType: "supplement_push",
      resourceId: review_id,
      detail: { patient_id: patientId, results },
      request,
    });

    return NextResponse.json({ results });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
