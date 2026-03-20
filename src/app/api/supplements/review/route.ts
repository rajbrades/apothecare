import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamCompletion, MODELS } from "@/lib/ai/provider";
import { formatPatientContext } from "@/lib/ai/visit-prompts";
import {
  buildSupplementReviewPrompt,
  formatLabContextForReview,
} from "@/lib/ai/supplement-prompts";
import { supplementReviewRequestSchema } from "@/lib/validations/supplement";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { auditLog } from "@/lib/api/audit";
import { validateAllReviewCitations } from "@/lib/citations/validate-supplement";
import { retrieveContext } from "@/lib/rag/retrieve";
import { formatRagContext } from "@/lib/rag/format-context";

export const runtime = "nodejs";
export const maxDuration = 120;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
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

    const rateLimitError = await checkRateLimit(
      supabase,
      practitioner.id,
      practitioner.subscription_tier,
      "supplement_review"
    );
    if (rateLimitError) return rateLimitError;

    // Validate input
    const body = await request.json();
    const parsed = supplementReviewRequestSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { patient_id, supplements: freeformSupplements, medications: freeformMedications, medical_context } = parsed.data;

    let patientContext = "";
    let labContext = "";
    let supplementsList: string | null = null;

    if (patient_id) {
      // ── Patient mode: fetch everything from DB ──────────────────────
      const { data: patient } = await supabase
        .from("patients")
        .select(
          "id, first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies, clinical_summary"
        )
        .eq("id", patient_id)
        .eq("practitioner_id", practitioner.id)
        .single();
      if (!patient) return jsonError("Patient not found", 404);

      const { data: biomarkers } = await supabase
        .from("biomarker_results")
        .select(
          "biomarker_name, value, unit, functional_flag, conventional_flag, lab_reports!inner(patient_id, collection_date)"
        )
        .eq("lab_reports.patient_id", patient_id)
        .order("lab_reports(collection_date)", { ascending: false })
        .limit(50);

      // Prefer structured patient_supplements over freeform patients.supplements
      const { data: structuredSupps } = await supabase
        .from("patient_supplements")
        .select("name, dosage, form, timing, brand")
        .eq("patient_id", patient_id)
        .eq("status", "active")
        .order("sort_order", { ascending: true });

      supplementsList =
        structuredSupps && structuredSupps.length > 0
          ? (structuredSupps as { name: string; dosage: string | null; form: string | null; timing: string | null; brand: string | null }[])
              .map((s) => {
                const parts = [s.name];
                if (s.dosage) parts.push(s.dosage);
                if (s.form) parts.push(`(${s.form})`);
                if (s.timing) parts.push(`— ${s.timing}`);
                if (s.brand) parts.push(`[${s.brand}]`);
                return parts.join(" ");
              })
              .join("\n")
          : patient.supplements;

      patientContext = formatPatientContext(patient);
      labContext = formatLabContextForReview(
        (biomarkers || []).map((b: any) => ({
          biomarker_name: b.biomarker_name,
          value: b.value,
          unit: b.unit,
          functional_flag: b.functional_flag,
          conventional_flag: b.conventional_flag,
          collection_date: b.lab_reports?.collection_date || null,
        }))
      );
    } else {
      // ── Freeform mode: use provided text ────────────────────────────
      supplementsList = freeformSupplements || null;

      const contextParts: string[] = [];
      if (freeformMedications?.trim()) {
        contextParts.push(`Current Medications: ${freeformMedications.trim()}`);
      }
      if (medical_context?.trim()) {
        contextParts.push(medical_context.trim());
      }
      patientContext = contextParts.length
        ? contextParts.join("\n\n")
        : "No patient context provided. Review supplements based on general evidence.";
    }

    // Fetch brand preferences (includes __strict_mode__ meta row)
    const { data: brandPrefs } = await supabase
      .from("practitioner_brand_preferences")
      .select("brand_name, priority, is_active")
      .eq("practitioner_id", practitioner.id)
      .order("priority", { ascending: true });

    const strictMode = brandPrefs?.some(
      (b: any) => b.brand_name === "__strict_mode__" && b.is_active
    ) ?? false;
    const activeBrands = (brandPrefs || []).filter(
      (b: any) => b.brand_name !== "__strict_mode__" && b.is_active
    );
    const brandNames = activeBrands.map((b: any) => b.brand_name);

    // Partnership RAG: retrieve relevant chunks based on the supplement list (best-effort)
    let partnershipContext = "";
    try {
      const ragQuery = [
        supplementsList ? `Supplement review: ${supplementsList}` : "",
        patientContext ? patientContext.slice(0, 300) : "",
      ].filter(Boolean).join(" ");

      if (ragQuery.trim()) {
        const partnerChunks = await retrieveContext({
          query: ragQuery,
          maxChunks: 5,
          threshold: 0.68,
        });
        partnershipContext = formatRagContext(partnerChunks);
      }
    } catch (err) {
      console.warn("[RAG] Partnership context retrieval failed for supplement review:", err);
    }

    const systemPrompt = buildSupplementReviewPrompt({
      patientContext,
      labContext: labContext || undefined,
      brandPreferences: brandNames.length ? brandNames : undefined,
      strictBrandMode: strictMode,
    }) + (partnershipContext ? "\n\n" + partnershipContext : "");

    // Insert review row with status 'generating'
    const { data: review, error: insertError } = await supabase
      .from("supplement_reviews")
      .insert({
        practitioner_id: practitioner.id,
        patient_id: patient_id || null,
        status: "generating",
        review_data: {},
        raw_ai_text: "",
      })
      .select()
      .single();

    if (insertError || !review) {
      console.error("Supplement review insert error:", insertError);
      return jsonError("Failed to create supplement review", 500);
    }

    const userMessage = `Review this supplement regimen and provide evidence-based recommendations.\n\n${patientContext ? `Context:\n${patientContext}\n\n` : ""}${labContext ? `Latest Lab Results:\n${labContext}\n\n` : ""}Current Supplements:\n${supplementsList || "No supplements currently listed."}`;

    const model = MODELS.standard;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const send = (data: object) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          send({ type: "review_id", review_id: review.id });

          let fullContent = "";
          const usage = await streamCompletion(
            {
              model,
              maxTokens: 4096,
              system: systemPrompt,
              messages: [{ role: "user", content: userMessage }],
            },
            {
              onText(text) {
                fullContent += text;
                send({ type: "text_delta", text });
              },
            }
          );

          // Parse JSON from AI response
          let reviewData: Record<string, unknown> = {};
          try {
            const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) reviewData = JSON.parse(jsonMatch[0]);
          } catch {
            /* use empty */
          }

          // Validate & enrich citations via CrossRef + PubMed + curated DB
          // Replaces AI-hallucinated single DOI with up to 3 verified citations per item
          try {
            await validateAllReviewCitations(reviewData, supabase);
          } catch (err) {
            console.warn("Citation validation failed (non-fatal):", err);
          }

          // Update review row
          await supabase
            .from("supplement_reviews")
            .update({
              review_data: reviewData,
              raw_ai_text: fullContent,
              status: "complete",
              model_used: model,
              input_tokens: usage.inputTokens,
              output_tokens: usage.outputTokens,
            })
            .eq("id", review.id);

          auditLog({
            request,
            practitionerId: practitioner.id,
            action: "generate",
            resourceType: "supplement_review",
            resourceId: review.id,
            detail: {
              patient_id: patient_id || null,
              freeform: !patient_id,
              model,
              input_tokens: usage.inputTokens,
              output_tokens: usage.outputTokens,
            },
          });

          send({
            type: "review_complete",
            data: reviewData,
            review_id: review.id,
          });

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Supplement review stream error:", err);

          // Update review status to error
          await supabase
            .from("supplement_reviews")
            .update({ status: "error" })
            .eq("id", review.id);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Generation interrupted" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Supplement review error:", error);
    return jsonError("Internal server error", 500);
  }
}
