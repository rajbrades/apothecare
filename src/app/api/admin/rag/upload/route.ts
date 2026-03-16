import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/cached-queries";
import { env } from "@/lib/env";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isAdmin(email: string): boolean {
  const admins = (env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

/**
 * POST /api/admin/rag/upload
 * Generate a signed upload URL for direct browser-to-Storage upload.
 * This bypasses Next.js/Vercel body size limits (4.5 MB) and allows
 * PDFs up to 50 MB to be uploaded directly from the browser.
 *
 * Body: { partnershipSlug: string, fileName: string }
 * Returns: { signedUrl: string, storagePath: string, token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const { partnershipSlug, fileName } = body;

    if (!partnershipSlug || !fileName) {
      return jsonError("partnershipSlug and fileName are required", 400);
    }

    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return jsonError("Only PDF files are allowed", 400);
    }

    const supabase = createServiceClient();

    // Verify partnership exists
    const { data: partnership, error: pErr } = await supabase
      .from("partnerships")
      .select("id, name")
      .eq("slug", partnershipSlug)
      .single();

    if (pErr || !partnership) {
      return jsonError(`Partnership "${partnershipSlug}" not found`, 404);
    }

    const storagePath = `${partnershipSlug}/${fileName}`;

    // Create a signed upload URL (valid for 10 minutes)
    const { data, error } = await supabase.storage
      .from("partnership-docs")
      .createSignedUploadUrl(storagePath, { upsert: true });

    if (error || !data) {
      return jsonError(error?.message || "Failed to create signed URL", 500);
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      storagePath,
      token: data.token,
      partnership: partnership.name,
    });
  } catch (err: any) {
    console.error("[RAG Upload] Error:", err);
    return jsonError(err.message, 500);
  }
}

/**
 * GET /api/admin/rag/upload
 * List files in storage for a partnership.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return jsonError("Unauthorized", 401);
    }

    const slug = request.nextUrl.searchParams.get("partnershipSlug");
    if (!slug) {
      return jsonError("partnershipSlug query parameter is required", 400);
    }

    const supabase = createServiceClient();

    const { data: files, error } = await supabase.storage
      .from("partnership-docs")
      .list(slug, { sortBy: { column: "name", order: "asc" } });

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({
      partnershipSlug: slug,
      files: (files || []).filter((f: any) => f.name.toLowerCase().endsWith(".pdf")),
    });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}

/**
 * DELETE /api/admin/rag/upload
 * Remove a file from storage.
 * Body: { partnershipSlug: string, fileName: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const { partnershipSlug, fileName } = body;

    if (!partnershipSlug || !fileName) {
      return jsonError("partnershipSlug and fileName are required", 400);
    }

    const supabase = createServiceClient();
    const storagePath = `${partnershipSlug}/${fileName}`;

    const { error } = await supabase.storage
      .from("partnership-docs")
      .remove([storagePath]);

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ deleted: storagePath });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
