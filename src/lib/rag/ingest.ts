import { createHash } from "crypto";
import { readFile } from "fs/promises";
import pdf from "pdf-parse";
import { createServiceClient } from "@/lib/supabase/server";
import { chunkDocument } from "./chunk";
import { embedBatch } from "@/lib/embeddings";
import type { IngestionResult } from "./types";

interface IngestOptions {
  /** Local file path — used if fileBuffer is not provided */
  filePath?: string;
  /** Raw PDF buffer — preferred for Supabase Storage workflows */
  fileBuffer?: Buffer;
  title: string;
  partnershipId: string;
  source: string;
  /** Stored as storage_path in DB for provenance */
  storagePath?: string;
  documentType?: string;
  topics?: string[];
  conditions?: string[];
  interventions?: string[];
}

/**
 * Ingest a PDF document: extract text, chunk, embed, and store.
 * Accepts either a local filePath or a raw fileBuffer.
 */
export async function ingestDocument(
  options: IngestOptions
): Promise<IngestionResult> {
  const supabase = createServiceClient();

  // 1. Resolve the PDF buffer
  let fileBuffer: Buffer;
  if (options.fileBuffer) {
    fileBuffer = options.fileBuffer;
  } else if (options.filePath) {
    fileBuffer = await readFile(options.filePath);
  } else {
    return {
      documentId: "",
      title: options.title,
      chunkCount: 0,
      status: "error",
      error: "Either filePath or fileBuffer must be provided",
    };
  }

  const fileHash = createHash("sha256").update(fileBuffer).digest("hex");

  // 2. Check if already ingested (same hash)
  const { data: existing } = await supabase
    .from("evidence_documents")
    .select("id, chunk_count")
    .eq("file_hash", fileHash)
    .eq("status", "ready")
    .maybeSingle();

  if (existing) {
    console.log(`[Ingest] Document already ingested (${existing.chunk_count} chunks): ${options.title}`);
    return {
      documentId: existing.id,
      title: options.title,
      chunkCount: existing.chunk_count,
      status: "ready",
    };
  }

  // 3. Extract text from PDF
  console.log(`[Ingest] Extracting text from: ${options.title}`);
  const pdfData = await pdf(fileBuffer);
  const extractedText = pdfData.text;

  if (!extractedText || extractedText.trim().length < 100) {
    return {
      documentId: "",
      title: options.title,
      chunkCount: 0,
      status: "error",
      error: "PDF text extraction returned insufficient content (possibly image-only PDF)",
    };
  }

  console.log(`[Ingest] Extracted ${extractedText.length} chars (${pdfData.numpages} pages)`);

  // 4. Create document record
  const recordPath = options.storagePath || options.filePath || "";
  const { data: doc, error: docError } = await supabase
    .from("evidence_documents")
    .insert({
      source: options.source,
      title: options.title,
      partnership_id: options.partnershipId,
      document_type: options.documentType || "monograph",
      file_hash: fileHash,
      storage_path: recordPath,
      status: "processing",
      topics: options.topics || [],
      conditions: options.conditions || [],
      interventions: options.interventions || [],
      full_text: extractedText,
    })
    .select("id")
    .single();

  if (docError || !doc) {
    return {
      documentId: "",
      title: options.title,
      chunkCount: 0,
      status: "error",
      error: `Failed to create document record: ${docError?.message}`,
    };
  }

  // 5. Chunk the text
  const chunks = chunkDocument(extractedText);
  console.log(`[Ingest] Created ${chunks.length} chunks`);

  // 6. Generate embeddings
  console.log(`[Ingest] Generating embeddings...`);
  const embeddings = await embedBatch(chunks.map((c) => c.content));

  // 7. Insert chunks with embeddings
  const chunkRows = chunks.map((chunk, i) => ({
    document_id: doc.id,
    content: chunk.content,
    chunk_index: chunk.chunkIndex,
    section_type: chunk.sectionType || null,
    embedding: JSON.stringify(embeddings[i]),
  }));

  // Insert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < chunkRows.length; i += BATCH_SIZE) {
    const batch = chunkRows.slice(i, i + BATCH_SIZE);
    const { error: chunkError } = await supabase
      .from("evidence_chunks")
      .insert(batch);

    if (chunkError) {
      // Cleanup on failure
      await supabase.from("evidence_documents").delete().eq("id", doc.id);
      return {
        documentId: doc.id,
        title: options.title,
        chunkCount: 0,
        status: "error",
        error: `Failed to insert chunks (batch ${i}): ${chunkError.message}`,
      };
    }
  }

  // 8. Update document status
  await supabase
    .from("evidence_documents")
    .update({ status: "ready", chunk_count: chunks.length })
    .eq("id", doc.id);

  console.log(`[Ingest] Done: ${options.title} — ${chunks.length} chunks embedded`);

  return {
    documentId: doc.id,
    title: options.title,
    chunkCount: chunks.length,
    status: "ready",
  };
}
