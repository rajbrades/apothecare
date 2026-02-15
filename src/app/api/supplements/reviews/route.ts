import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supplementReviewListSchema } from "@/lib/validations/supplement";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Parse and validate query params
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = supplementReviewListSchema.safeParse(params);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { cursor, limit, patient_id } = parsed.data;

    // Build query
    let query = supabase
      .from("supplement_reviews")
      .select(
        "id, patient_id, status, review_data, model_used, input_tokens, output_tokens, created_at, updated_at, patients(first_name, last_name)"
      )
      .eq("practitioner_id", practitioner.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (patient_id) query = query.eq("patient_id", patient_id);
    if (cursor) query = query.lt("created_at", cursor);

    const { data: reviews, error } = await query;
    if (error) return jsonError("Failed to fetch supplement reviews", 500);

    const reviewList = reviews || [];
    const hasMore = reviewList.length > limit;
    const trimmed = hasMore ? reviewList.slice(0, limit) : reviewList;
    const nextCursor =
      hasMore && trimmed.length > 0
        ? trimmed[trimmed.length - 1].created_at
        : null;

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "supplement_review",
      detail: { list: true, count: trimmed.length },
    });

    return new Response(
      JSON.stringify({ reviews: trimmed, nextCursor }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Supplement reviews list error:", error);
    return jsonError("Internal server error", 500);
  }
}
