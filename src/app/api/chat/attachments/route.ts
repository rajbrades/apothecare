import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { uploadToStorage } from "@/lib/storage/patient-documents";
import { sanitizeFilename } from "@/lib/sanitize";
import { getAnthropicClient, ANTHROPIC_MODELS } from "@/lib/ai/provider";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_EXTRACTED_TEXT = 12000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

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
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return jsonError("No file provided", 400);

    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File too large (max 10MB)", 400);
    }

    const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError("Only PDF, JPG, and PNG files are supported", 400);
    }

    const attachmentId = randomUUID();
    const safeName = sanitizeFilename(file.name);
    const storagePath = `${practitioner.id}/chat-attachments/${attachmentId}/${safeName}`;

    // Upload to Supabase storage
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToStorage(storagePath, buffer, file.type);

    // Extract text using Anthropic vision
    let extractedText = "";
    try {
      const base64Data = buffer.toString("base64");
      const anthropic = getAnthropicClient();
      const isPdf = file.type === "application/pdf";
      const sourceBlock = isPdf
        ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64Data } }
        : { type: "image" as const, source: { type: "base64" as const, media_type: file.type as "image/jpeg" | "image/png", data: base64Data } };
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODELS.vision,
        max_tokens: 4096,
        system: isPdf
          ? "You are a document text extractor. Extract all readable text content from this document. Return the raw text content only — no JSON, no markdown formatting, no commentary. Preserve the document structure with headings and line breaks."
          : "You are a clinical document reader. Extract all readable text, values, labels, and data from this image. If it's a lab report or clinical form, preserve the structure (biomarker names, values, units, reference ranges). Return raw text content only — no JSON, no markdown formatting, no commentary.",
        messages: [
          {
            role: "user",
            content: [
              sourceBlock,
              {
                type: "text",
                text: isPdf ? "Extract all text from this document." : "Extract all text and data from this image.",
              },
            ],
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      if (textContent && "text" in textContent) {
        extractedText = textContent.text.slice(0, MAX_EXTRACTED_TEXT);
      }
    } catch (err) {
      console.error("Chat attachment text extraction failed:", err);
      // Non-fatal — file is still attached, just without extracted text
    }

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "upload",
      resourceType: "chat_attachment",
      resourceId: attachmentId,
      detail: {
        file_name: safeName,
        file_size: file.size,
        has_extracted_text: extractedText.length > 0,
      },
    });

    return NextResponse.json({
      id: attachmentId,
      name: safeName,
      size: file.size,
      type: file.type,
      storage_path: storagePath,
      extracted_text: extractedText,
    });
  } catch (error) {
    console.error("Chat attachment upload error:", error);
    return jsonError("Internal server error", 500);
  }
}
