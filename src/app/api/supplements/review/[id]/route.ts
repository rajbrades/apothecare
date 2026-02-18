import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
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

    // Fetch review with patient join
    const { data: review, error } = await supabase
      .from("supplement_reviews")
      .select("*, patients(first_name, last_name)")
      .eq("id", reviewId)
      .single();

    if (error || !review) return jsonError("Review not found", 404);

    // Verify practitioner ownership
    if (review.practitioner_id !== practitioner.id) {
      return jsonError("Review not found", 404);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "supplement_review",
      resourceId: reviewId,
    });

    return new Response(JSON.stringify({ review }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Supplement review fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}
