import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";

export const runtime = "nodejs";
import { resolve } from "path";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { chunkDocument } from "@/lib/rag/chunk";
import { embedBatch } from "@/lib/rag/embed";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { env } from "@/lib/env";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isAdmin(email: string): boolean {
  const admins = (env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

/**
 * POST /api/admin/rag/ingest
 * Ingest all PDFs from a partnership's local directory.
 * Body: { partnershipSlug: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: must be logged-in admin
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const { partnershipSlug } = body;

    if (!partnershipSlug) {
      return jsonError("partnershipSlug is required", 400);
    }

    const supabase = createServiceClient();

    // Get partnership
    const { data: partnership, error: pErr } = await supabase
      .from("partnerships")
      .select("id, name")
      .eq("slug", partnershipSlug)
      .single();

    if (pErr || !partnership) {
      return jsonError(`Partnership "${partnershipSlug}" not found`, 404);
    }

    // Find PDFs in local docs directory
    const docsDir = resolve(process.cwd(), `docs/partnerships/${partnershipSlug}`);
    let files: string[];
    try {
      files = (await readdir(docsDir)).filter((f) => f.toLowerCase().endsWith(".pdf"));
    } catch {
      return jsonError(`No docs directory found at: docs/partnerships/${partnershipSlug}`, 404);
    }

    if (files.length === 0) {
      return jsonError("No PDF files found in directory", 404);
    }

    const results = [];

    for (const file of files) {
      const filePath = resolve(docsDir, file);
      const title = file.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

      try {
        // Read and hash
        const fileBuffer = await readFile(filePath);
        const fileHash = createHash("sha256").update(fileBuffer).digest("hex");

        // Skip if already ingested
        const { data: existing } = await supabase
          .from("evidence_documents")
          .select("id, chunk_count")
          .eq("file_hash", fileHash)
          .eq("status", "ready")
          .maybeSingle();

        if (existing) {
          results.push({
            file,
            title,
            status: "skipped",
            message: "Already ingested",
            chunkCount: existing.chunk_count,
            documentId: existing.id,
          });
          continue;
        }

        // Extract text using unpdf (serverless-compatible, no DOMMatrix dependency)
        const { extractText } = await import("unpdf");
        const { text: pages, totalPages } = await extractText(new Uint8Array(fileBuffer), { mergePages: true });
        const text = Array.isArray(pages) ? pages.join("\n") : (pages ?? "");

        if (!text || text.trim().length < 100) {
          results.push({
            file,
            title,
            status: "error",
            message: "Insufficient text extracted (image-only PDF?)",
          });
          continue;
        }

        // Create document record
        const { data: doc, error: docErr } = await supabase
          .from("evidence_documents")
          .insert({
            source: partnershipSlug.replace(/-/g, "_"),
            title,
            partnership_id: partnership.id,
            document_type: "masterclass",
            file_hash: fileHash,
            storage_path: `docs/partnerships/${partnershipSlug}/${file}`,
            status: "processing",
            topics: ["thyroid", "hypothyroidism", "hashimotos", "t3", "t4", "tsh"],
            conditions: ["hypothyroidism", "hashimotos_thyroiditis", "hyperthyroidism"],
            interventions: ["selenium", "iodine", "zinc", "vitamin_d", "thyroid_support"],
          })
          .select("id")
          .single();

        if (docErr || !doc) {
          results.push({ file, title, status: "error", message: docErr?.message });
          continue;
        }

        // Chunk
        const chunks = chunkDocument(text);

        // Embed
        const embeddings = await embedBatch(chunks.map((c) => c.content));

        // Insert chunks in batches
        const BATCH = 50;
        for (let i = 0; i < chunks.length; i += BATCH) {
          const batch = chunks.slice(i, i + BATCH).map((chunk, j) => ({
            document_id: doc.id,
            content: chunk.content,
            chunk_index: chunk.chunkIndex,
            section_type: chunk.sectionType || null,
            embedding: JSON.stringify(embeddings[i + j]),
          }));

          const { error: chunkErr } = await supabase
            .from("evidence_chunks")
            .insert(batch);

          if (chunkErr) {
            await supabase.from("evidence_documents").delete().eq("id", doc.id);
            results.push({ file, title, status: "error", message: chunkErr.message });
            continue;
          }
        }

        // Mark ready
        await supabase
          .from("evidence_documents")
          .update({ status: "ready", chunk_count: chunks.length })
          .eq("id", doc.id);

        results.push({
          file,
          title,
          status: "ready",
          chunkCount: chunks.length,
          documentId: doc.id,
          pages: totalPages,
          textLength: text.length,
        });
      } catch (err: any) {
        results.push({
          file,
          title,
          status: "error",
          message: err.message,
        });
      }
    }

    const totalChunks = results.reduce((sum, r) => sum + (r.chunkCount || 0), 0);

    return NextResponse.json({
      partnership: partnership.name,
      filesProcessed: results.length,
      totalChunks,
      results,
    });
  } catch (err: any) {
    console.error("[RAG Ingest] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/admin/rag/ingest — List ingested partnership documents
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return jsonError("Unauthorized", 401);
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("evidence_documents")
      .select("id, title, source, document_type, status, chunk_count, partnership_id, ingested_at")
      .not("partnership_id", "is", null)
      .order("ingested_at", { ascending: false });

    if (error) return jsonError("Internal server error", 500);

    return NextResponse.json({ documents: data || [] });
  } catch (err: any) {
    return jsonError("Internal server error", 500);
  }
}
