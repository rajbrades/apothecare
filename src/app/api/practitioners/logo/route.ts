import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";

const BUCKET = "practice-assets";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/practitioners/logo — Get signed URL for logo preview ──

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, logo_storage_path")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner?.logo_storage_path) return jsonError("No logo", 404);

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient.storage
      .from(BUCKET)
      .createSignedUrl(practitioner.logo_storage_path, 3600);

    if (error || !data?.signedUrl) {
      return jsonError("Failed to generate URL", 500);
    }

    return NextResponse.json(
      { url: data.signedUrl },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/practitioners/logo — Upload practice logo ──

export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, logo_storage_path")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;
    if (!file) return jsonError("No file provided", 400);

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError("Invalid file type. Accepted: PNG, JPEG, SVG, WebP", 400);
    }

    if (file.size > MAX_SIZE) {
      return jsonError("File too large. Maximum size is 2MB", 400);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const storagePath = `${practitioner.id}/logo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const serviceClient = createServiceClient();

    // Delete old logo if it exists and has a different path
    if (practitioner.logo_storage_path && practitioner.logo_storage_path !== storagePath) {
      await serviceClient.storage
        .from(BUCKET)
        .remove([practitioner.logo_storage_path]);
    }

    // Upload new logo (upsert to overwrite if same extension)
    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return jsonError(`Upload failed: ${uploadError.message}`, 500);
    }

    // Save storage path to practitioner record
    const { error: updateError } = await supabase
      .from("practitioners")
      .update({ logo_storage_path: storagePath })
      .eq("id", practitioner.id);

    if (updateError) {
      return jsonError("Failed to save logo path", 500);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "update",
      resourceType: "practitioner_logo",
      detail: { action: "upload", file_type: file.type, file_size: file.size },
    });

    return NextResponse.json({ success: true, logo_storage_path: storagePath });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── DELETE /api/practitioners/logo — Remove practice logo ──

export async function DELETE(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, logo_storage_path")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    if (!practitioner.logo_storage_path) {
      return NextResponse.json({ success: true });
    }

    const serviceClient = createServiceClient();
    await serviceClient.storage
      .from(BUCKET)
      .remove([practitioner.logo_storage_path]);

    const { error: updateError } = await supabase
      .from("practitioners")
      .update({ logo_storage_path: null })
      .eq("id", practitioner.id);

    if (updateError) {
      return jsonError("Failed to clear logo path", 500);
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "delete",
      resourceType: "practitioner_logo",
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
