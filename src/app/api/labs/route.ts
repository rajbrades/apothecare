import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadLabSchema, labListQuerySchema } from "@/lib/validations/lab";
import { buildLabStoragePath, uploadToStorage } from "@/lib/storage/lab-reports";
import { parseLabReport } from "@/lib/ai/lab-parsing";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { sanitizeFilename } from "@/lib/sanitize";
import { escapePostgrestPattern } from "@/lib/search";
import { auditLog } from "@/lib/api/audit";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — Claude Vision PDF parsing can be slow

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/labs — List lab reports with pagination & filters ─────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = labListQuerySchema.safeParse(params);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { cursor, limit, status, test_type, lab_vendor, patient_id, search, include_archived, unlinked } = parsed.data;

    let query = supabase
      .from("lab_reports")
      .select("id, test_name, lab_vendor, test_type, collection_date, status, raw_file_name, raw_file_size, patient_id, error_message, is_archived, created_at, updated_at, patients(first_name, last_name)")
      .eq("practitioner_id", practitioner.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!include_archived) query = query.eq("is_archived", false);

    if (status) query = query.eq("status", status);
    if (test_type) query = query.eq("test_type", test_type);
    if (lab_vendor) query = query.eq("lab_vendor", lab_vendor);
    if (patient_id) query = query.eq("patient_id", patient_id);
    if (unlinked) query = query.is("patient_id", null);
    if (cursor) query = query.lt("created_at", cursor);
    if (search) {
      // Search across test_name and raw_file_name (patient name filtering done client-side from joined data)
      const escaped = escapePostgrestPattern(search);
      const term = `%${escaped}%`;
      query = query.or(`test_name.ilike.${term},raw_file_name.ilike.${term}`);
    }

    const { data: labs, error } = await query;
    if (error) return jsonError("Failed to fetch lab reports", 500);

    const nextCursor = labs && labs.length === limit
      ? labs[labs.length - 1].created_at
      : null;

    const labList = labs || [];

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "read",
      resourceType: "lab_report",
      detail: { list: true, count: labList.length },
    });

    return NextResponse.json({ labs: labList, nextCursor });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

// ── POST /api/labs — Upload a lab report PDF ──────────────────────────
export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Lab interpretation is a Pro feature
    if (practitioner.subscription_tier !== "pro") {
      return jsonError("Lab interpretation is a Pro feature. Upgrade to access.", 403);
    }

    const rateLimitError = await checkRateLimit(
      supabase, practitioner.id, practitioner.subscription_tier, "lab_upload"
    );
    if (rateLimitError) return rateLimitError;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return jsonError("No file provided", 400);

    // Validate file
    if (file.type !== "application/pdf") {
      return jsonError("Only PDF files are accepted", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File size exceeds 10MB limit", 400);
    }

    // Parse metadata
    const metadata = {
      patient_id: formData.get("patient_id") as string || undefined,
      lab_vendor: formData.get("lab_vendor") as string || undefined,
      test_type: formData.get("test_type") as string || undefined,
      test_name: formData.get("test_name") as string || undefined,
      collection_date: formData.get("collection_date") as string || undefined,
    };
    const parsed = uploadLabSchema.safeParse(metadata);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const patientId = parsed.data.patient_id || null;

    // If patient provided, verify ownership
    if (patientId) {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("id", patientId)
        .eq("practitioner_id", practitioner.id)
        .single();
      if (!patient) return jsonError("Patient not found", 404);
    }

    // Create lab report record
    const { data: report, error: insertError } = await supabase
      .from("lab_reports")
      .insert({
        practitioner_id: practitioner.id,
        patient_id: patientId,
        lab_vendor: parsed.data.lab_vendor || "other",
        test_type: parsed.data.test_type || "other",
        test_name: parsed.data.test_name || null,
        collection_date: parsed.data.collection_date || null,
        raw_file_url: "",
        raw_file_name: sanitizeFilename(file.name),
        raw_file_size: file.size,
        parsed_data: {},
        status: "uploading",
      })
      .select()
      .single();

    if (insertError || !report) {
      console.error("Lab report insert error:", insertError);
      return jsonError("Failed to create lab report record", 500);
    }

    // Upload to storage
    const storagePath = buildLabStoragePath(practitioner.id, report.id, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await uploadToStorage(storagePath, buffer, file.type);
    } catch {
      await supabase.from("lab_reports").delete().eq("id", report.id);
      return jsonError("Failed to upload file", 500);
    }

    // Update record with storage path
    await supabase
      .from("lab_reports")
      .update({ raw_file_url: storagePath })
      .eq("id", report.id);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "upload",
      resourceType: "lab_report",
      resourceId: report.id,
      detail: {
        patient_id: patientId,
        file_name: file.name,
        file_size: file.size,
        lab_vendor: parsed.data.lab_vendor,
        test_type: parsed.data.test_type,
      },
    });

    // Schedule parsing to run after response is sent.
    // `after()` keeps the Vercel Lambda alive until parsing completes,
    // preventing the fire-and-forget from being killed early.
    after(async () => {
      try {
        await parseLabReport(report.id, storagePath, practitioner.id, patientId);
      } catch (err) {
        console.error("Lab parsing failed:", err);
        // Mark as error so the UI doesn't show "processing" forever
        const { createServiceClient } = await import("@/lib/supabase/server");
        const svc = createServiceClient();
        await svc
          .from("lab_reports")
          .update({ status: "error" })
          .eq("id", report.id)
          .catch(() => {});
      }
    });

    return NextResponse.json({
      report: { ...report, raw_file_url: storagePath },
    }, { status: 201 });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
