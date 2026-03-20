import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { downloadFromStorage } from "@/lib/storage/patient-documents";
import JSZip from "jszip";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 120;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const bodySchema = z.object({
  includePdfs: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const rateLimitError = await checkRateLimit(
      supabase, practitioner.id, practitioner.subscription_tier, "data_export"
    );
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    const includePdfs = parsed.success ? parsed.data.includePdfs : false;

    // Query all practitioner data in parallel
    const [
      { data: patients },
      { data: visits },
      { data: labReports },
      { data: conversations },
      { data: supplements },
      { data: supplementReviews },
      { data: timelineEvents },
    ] = await Promise.all([
      supabase.from("patients").select("*").eq("practitioner_id", practitioner.id),
      supabase.from("visits").select("*").eq("practitioner_id", practitioner.id),
      supabase.from("lab_reports").select("*").eq("practitioner_id", practitioner.id),
      supabase.from("conversations").select("*").eq("practitioner_id", practitioner.id),
      supabase.from("patient_supplements").select("*").eq("practitioner_id", practitioner.id),
      supabase.from("supplement_reviews").select("*").eq("practitioner_id", practitioner.id),
      supabase.from("timeline_events").select("*").eq("practitioner_id", practitioner.id),
    ]);

    // Biomarker results — join through lab_reports
    const labReportIds = (labReports || []).map((r: { id: string }) => r.id);
    let biomarkerResults: unknown[] = [];
    if (labReportIds.length > 0) {
      // Supabase .in() has a limit, batch if needed
      const batches: string[][] = [];
      for (let i = 0; i < labReportIds.length; i += 100) {
        batches.push(labReportIds.slice(i, i + 100));
      }
      for (const batch of batches) {
        const { data } = await supabase
          .from("biomarker_results")
          .select("*")
          .in("lab_report_id", batch);
        if (data) biomarkerResults.push(...data);
      }
    }

    // Messages — join through conversations
    const conversationIds = (conversations || []).map((c: { id: string }) => c.id);
    let messages: unknown[] = [];
    if (conversationIds.length > 0) {
      const batches: string[][] = [];
      for (let i = 0; i < conversationIds.length; i += 100) {
        batches.push(conversationIds.slice(i, i + 100));
      }
      for (const batch of batches) {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", batch);
        if (data) messages.push(...data);
      }
    }

    // Build ZIP
    const zip = new JSZip();
    const today = new Date().toISOString().split("T")[0];

    // Remove sensitive fields from practitioner export
    const { auth_user_id: _, ...practitionerExport } = practitioner;

    zip.file("practitioner.json", JSON.stringify(practitionerExport, null, 2));
    zip.file("patients.json", JSON.stringify(patients || [], null, 2));
    zip.file("visits.json", JSON.stringify(visits || [], null, 2));
    zip.file("lab_reports.json", JSON.stringify(labReports || [], null, 2));
    zip.file("biomarker_results.json", JSON.stringify(biomarkerResults, null, 2));
    zip.file("conversations.json", JSON.stringify(conversations || [], null, 2));
    zip.file("messages.json", JSON.stringify(messages, null, 2));
    zip.file("patient_supplements.json", JSON.stringify(supplements || [], null, 2));
    zip.file("supplement_reviews.json", JSON.stringify(supplementReviews || [], null, 2));
    zip.file("timeline_events.json", JSON.stringify(timelineEvents || [], null, 2));

    // Optionally include lab PDFs
    let pdfCount = 0;
    if (includePdfs && labReports && labReports.length > 0) {
      const pdfsFolder = zip.folder("pdfs");
      if (pdfsFolder) {
        for (const report of labReports) {
          if (!report.raw_file_url) continue;
          try {
            const buffer = await downloadFromStorage(report.raw_file_url);
            // Use UUID filename to avoid PHI in ZIP entry names
            const filename = `${report.id}.pdf`;
            pdfsFolder.file(filename, buffer);
            pdfCount++;
          } catch {
            // Non-fatal — skip inaccessible PDFs
          }
        }
      }
    }

    // Manifest
    const manifest = {
      exported_at: new Date().toISOString(),
      format_version: "1.0",
      practitioner_id: practitioner.id,
      include_pdfs: includePdfs,
      counts: {
        patients: (patients || []).length,
        visits: (visits || []).length,
        lab_reports: (labReports || []).length,
        biomarker_results: biomarkerResults.length,
        conversations: (conversations || []).length,
        messages: messages.length,
        patient_supplements: (supplements || []).length,
        supplement_reviews: (supplementReviews || []).length,
        timeline_events: (timelineEvents || []).length,
        pdfs: pdfCount,
      },
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "export",
      resourceType: "account",
      detail: { includePdfs, ...manifest.counts },
    });

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="apothecare-export-${today}.zip"`,
      },
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
