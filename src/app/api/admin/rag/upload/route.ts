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
 * Upload PDF files to Supabase Storage for a partnership.
 * Expects multipart/form-data with:
 *   - partnershipSlug: string
 *   - files: File[] (one or more PDFs)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return jsonError("Unauthorized", 401);
    }

    const formData = await request.formData();
    const partnershipSlug = formData.get("partnershipSlug") as string;

    if (!partnershipSlug) {
      return jsonError("partnershipSlug is required", 400);
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

    // Collect all file entries
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        if (!value.name.toLowerCase().endsWith(".pdf")) {
          return jsonError(`File "${value.name}" is not a PDF`, 400);
        }
        if (value.size > 50 * 1024 * 1024) {
          return jsonError(`File "${value.name}" exceeds 50 MB limit`, 400);
        }
        files.push(value);
      }
    }

    if (files.length === 0) {
      return jsonError("No PDF files provided", 400);
    }

    const results = [];

    for (const file of files) {
      const storagePath = `${partnershipSlug}/${file.name}`;

      // Upload to Supabase Storage
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadErr } = await supabase.storage
        .from("partnership-docs")
        .upload(storagePath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadErr) {
        results.push({
          file: file.name,
          status: "error" as const,
          message: uploadErr.message,
        });
        continue;
      }

      results.push({
        file: file.name,
        status: "uploaded" as const,
        storagePath,
        size: file.size,
      });
    }

    return NextResponse.json({
      partnership: partnership.name,
      uploaded: results.filter((r) => r.status === "uploaded").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
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
