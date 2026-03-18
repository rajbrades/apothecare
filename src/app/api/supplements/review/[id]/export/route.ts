import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";
import { randomUUID } from "crypto";
import {
  buildLetterhead,
  buildPatientBar,
  buildFooter,
  buildExportPage,
  fetchLogoAsBase64,
  EXPORT_HEADERS,
} from "@/lib/export/shared";
import { buildSupplementProtocolBody } from "@/lib/export/supplement-protocol";

/**
 * GET /api/supplements/review/[id]/export — Generate a branded, printable supplement protocol.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  if (!practitioner) {
    return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
  }

  const { data: review } = await supabase
    .from("supplement_reviews")
    .select("*, patients(first_name, last_name, date_of_birth, sex)")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.status !== "complete" || !review.review_data) {
    return NextResponse.json({ error: "Review is not complete" }, { status: 400 });
  }

  const exportSessionId = randomUUID();
  const exportedAt = new Date().toISOString();

  auditLog({
    request,
    practitionerId: practitioner.id,
    action: "export",
    resourceType: "supplement_review",
    resourceId: id,
    detail: { export_session_id: exportSessionId },
  });

  const logoDataUri = await fetchLogoAsBase64(practitioner.logo_storage_path);

  const reviewDate = new Date(review.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const letterhead = buildLetterhead(
    "Supplement Protocol",
    `Generated: ${reviewDate}`,
    practitioner,
    logoDataUri
  );

  const patientBar = review.patients
    ? buildPatientBar(review.patients)
    : "";

  const protocolBody = buildSupplementProtocolBody(review.review_data);

  const footer = buildFooter(
    "Verify interactions with patient's pharmacist before implementation.",
    exportSessionId,
    exportedAt
  );

  const body = `${letterhead}\n${patientBar}\n${protocolBody}\n${footer}`;

  const patientName = review.patients
    ? [review.patients.last_name, review.patients.first_name].filter(Boolean).join(", ")
    : "Freeform";

  const html = buildExportPage(
    `Supplement Protocol — ${patientName} — ${reviewDate}`,
    body
  );

  return new Response(html, { headers: EXPORT_HEADERS });
}
