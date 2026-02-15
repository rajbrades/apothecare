import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  SUPPORTED_BRANDS,
  updateBrandPreferencesSchema,
} from "@/lib/validations/supplement";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/supplements/brands — List brand preferences ────────────
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

    const { data: brands, error } = await supabase
      .from("practitioner_brand_preferences")
      .select("id, brand_name, priority, is_active, created_at, updated_at")
      .eq("practitioner_id", practitioner.id)
      .order("priority", { ascending: true });

    if (error) return jsonError("Failed to fetch brand preferences", 500);

    return new Response(
      JSON.stringify({
        brands: brands || [],
        supported_brands: SUPPORTED_BRANDS,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Brand preferences fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}

// ── PUT /api/supplements/brands — Update brand preferences ──────────
export async function PUT(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

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

    // Validate input
    const body = await request.json();
    const parsed = updateBrandPreferencesSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { brands: brandInputs } = parsed.data;

    // Delete all existing preferences for this practitioner
    const { error: deleteError } = await supabase
      .from("practitioner_brand_preferences")
      .delete()
      .eq("practitioner_id", practitioner.id);

    if (deleteError) {
      console.error("Brand preferences delete error:", deleteError);
      return jsonError("Failed to update brand preferences", 500);
    }

    // Insert new preferences
    let brands: any[] = [];
    if (brandInputs.length > 0) {
      const rows = brandInputs.map((b, index) => ({
        practitioner_id: practitioner.id,
        brand_name: b.brand_name,
        priority: b.priority ?? index,
        is_active: b.is_active ?? true,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("practitioner_brand_preferences")
        .insert(rows)
        .select("id, brand_name, priority, is_active, created_at, updated_at");

      if (insertError) {
        console.error("Brand preferences insert error:", insertError);
        return jsonError("Failed to save brand preferences", 500);
      }

      brands = inserted || [];
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "brand_preferences",
      detail: { count: brands.length },
    });

    return new Response(JSON.stringify({ brands }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Brand preferences update error:", error);
    return jsonError("Internal server error", 500);
  }
}
