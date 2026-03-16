import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import pdf from "pdf-parse";
import { createServiceClient } from "@/lib/supabase/server";
import { chunkDocument } from "@/lib/rag/chunk";
import { embedBatch } from "@/lib/rag/embed";
import { getAuthUser } from "@/lib/supabase/cached-queries";
import { env } from "@/lib/env";

// Allow up to 5 minutes for large PDF ingestion on Vercel Pro
export const maxDuration = 300;

function isAdmin(email: string): boolean {
  const admins = (env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

/**
 * POST /api/admin/rag/ingest
 * Ingest PDFs from Supabase Storage for a partnership.
 * Streams NDJSON progress events so the UI can show per-file status in real time.
 *
 * Body: { partnershipSlug: string }
 */
export async function POST(request: NextRequest) {
  // Auth: must be logged-in admin
  const user = await getAuthUser();
  if (!user || !isAdmin(user.email || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { partnershipSlug } = body;

  if (!partnershipSlug) {
    return NextResponse.json({ error: "partnershipSlug is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get partnership
  const { data: partnership, error: pErr } = await supabase
    .from("partnerships")
    .select("id, name")
    .eq("slug", partnershipSlug)
    .single();

  if (pErr || !partnership) {
    return NextResponse.json(
      { error: `Partnership "${partnershipSlug}" not found` },
      { status: 404 }
    );
  }

  // List PDFs in Supabase Storage
  const { data: storageFiles, error: listErr } = await supabase.storage
    .from("partnership-docs")
    .list(partnershipSlug, { sortBy: { column: "name", order: "asc" } });

  if (listErr) {
    return NextResponse.json(
      { error: `Failed to list files: ${listErr.message}` },
      { status: 500 }
    );
  }

  const pdfFiles = (storageFiles || []).filter((f: any) =>
    f.name.toLowerCase().endsWith(".pdf")
  );

  if (pdfFiles.length === 0) {
    return NextResponse.json(
      { error: `No PDF files found in storage for "${partnershipSlug}". Upload files first.` },
      { status: 404 }
    );
  }

  // Stream NDJSON events for real-time progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }

      send({
        type: "start",
        partnership: partnership.name,
        totalFiles: pdfFiles.length,
      });

      let totalChunks = 0;

      for (let fileIdx = 0; fileIdx < pdfFiles.length; fileIdx++) {
        const file = pdfFiles[fileIdx];
        const storagePath = `${partnershipSlug}/${file.name}`;
        const title = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

        send({
          type: "file_start",
          file: file.name,
          title,
          index: fileIdx,
          total: pdfFiles.length,
        });

        try {
          // Download from Supabase Storage
          const { data: fileData, error: dlErr } = await supabase.storage
            .from("partnership-docs")
            .download(storagePath);

          if (dlErr || !fileData) {
            send({ type: "file_done", file: file.name, status: "error", message: dlErr?.message || "Download failed" });
            continue;
          }

          const fileBuffer = Buffer.from(await fileData.arrayBuffer());
          const fileHash = createHash("sha256").update(fileBuffer).digest("hex");

          // Skip if already ingested
          const { data: existing } = await supabase
            .from("evidence_documents")
            .select("id, chunk_count")
            .eq("file_hash", fileHash)
            .eq("status", "ready")
            .maybeSingle();

          if (existing) {
            totalChunks += existing.chunk_count || 0;
            send({
              type: "file_done",
              file: file.name,
              status: "skipped",
              message: "Already ingested",
              chunkCount: existing.chunk_count,
              documentId: existing.id,
            });
            continue;
          }

          // Extract text
          send({ type: "file_progress", file: file.name, step: "extracting" });
          const pdfData = await pdf(fileBuffer);
          const text = pdfData.text;

          if (!text || text.trim().length < 100) {
            send({ type: "file_done", file: file.name, status: "error", message: "Insufficient text (image-only PDF?)" });
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
              storage_path: storagePath,
              status: "processing",
              topics: ["thyroid", "hypothyroidism", "hashimotos", "t3", "t4", "tsh"],
              conditions: ["hypothyroidism", "hashimotos_thyroiditis", "hyperthyroidism"],
              interventions: ["selenium", "iodine", "zinc", "vitamin_d", "thyroid_support"],
            })
            .select("id")
            .single();

          if (docErr || !doc) {
            send({ type: "file_done", file: file.name, status: "error", message: docErr?.message });
            continue;
          }

          // Chunk
          send({ type: "file_progress", file: file.name, step: "chunking" });
          const chunks = chunkDocument(text);

          // Embed + insert incrementally in batches of 50.
          // This keeps peak memory low: we only hold one batch of embeddings at a time
          // instead of all embeddings for the entire document.
          const BATCH = 50;
          let chunkInsertFailed = false;

          for (let i = 0; i < chunks.length; i += BATCH) {
            const batchChunks = chunks.slice(i, i + BATCH);

            send({
              type: "file_progress",
              file: file.name,
              step: "embedding",
              chunksProcessed: i,
              chunksTotal: chunks.length,
            });

            // Embed only this batch
            const batchEmbeddings = await embedBatch(
              batchChunks.map((c) => c.content)
            );

            // Insert this batch immediately
            const rows = batchChunks.map((chunk, j) => ({
              document_id: doc.id,
              content: chunk.content,
              chunk_index: chunk.chunkIndex,
              section_type: chunk.sectionType || null,
              embedding: JSON.stringify(batchEmbeddings[j]),
            }));

            const { error: chunkErr } = await supabase
              .from("evidence_chunks")
              .insert(rows);

            if (chunkErr) {
              await supabase.from("evidence_documents").delete().eq("id", doc.id);
              send({ type: "file_done", file: file.name, status: "error", message: chunkErr.message });
              chunkInsertFailed = true;
              break;
            }
          }

          if (chunkInsertFailed) continue;

          // Mark ready
          await supabase
            .from("evidence_documents")
            .update({ status: "ready", chunk_count: chunks.length })
            .eq("id", doc.id);

          totalChunks += chunks.length;

          send({
            type: "file_done",
            file: file.name,
            title,
            status: "ready",
            chunkCount: chunks.length,
            documentId: doc.id,
            pages: pdfData.numpages,
            textLength: text.length,
          });
        } catch (err: any) {
          send({ type: "file_done", file: file.name, status: "error", message: err.message });
        }
      }

      send({
        type: "complete",
        partnership: partnership.name,
        filesProcessed: pdfFiles.length,
        totalChunks,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}

/**
 * GET /api/admin/rag/ingest — List ingested partnership documents
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("evidence_documents")
      .select("id, title, source, document_type, status, chunk_count, partnership_id, ingested_at")
      .not("partnership_id", "is", null)
      .order("ingested_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ documents: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
