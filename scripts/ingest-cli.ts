import { readFile, readdir } from "fs/promises";
import { resolve } from "path";
import { createHash } from "crypto";
import pdf from "pdf-parse";
import { createClient } from "@supabase/supabase-js";
import { chunkDocument } from "../src/lib/rag/chunk";
import { embedBatch } from "../src/lib/rag/embed";
import { config } from "dotenv";

config({ path: ".env.local" });

async function run() {
  const partnershipSlug = "apex-energetics";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Fetching partnership...");
  const { data: partnership, error: pErr } = await supabase
    .from("partnerships")
    .select("id, name")
    .eq("slug", partnershipSlug)
    .single();

  if (pErr || !partnership) {
    console.error(`Partnership "${partnershipSlug}" not found`, pErr);
    process.exit(1);
  }

  const docsDir = resolve(process.cwd(), `docs/partnerships/${partnershipSlug}`);
  let files: string[];
  try {
    files = (await readdir(docsDir)).filter((f) => f.toLowerCase().endsWith(".pdf"));
  } catch (err) {
    console.error(`No docs directory found at: docs/partnerships/${partnershipSlug}`, err);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("No PDF files found in directory");
    process.exit(0);
  }

  let totalChunks = 0;

  for (const file of files) {
    const filePath = resolve(docsDir, file);
    const title = file.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

    console.log(`\nProcessing: ${file}`);
    const fileBuffer = await readFile(filePath);
    const fileHash = createHash("sha256").update(fileBuffer).digest("hex");

    const { data: existing } = await supabase
      .from("evidence_documents")
      .select("id, chunk_count")
      .eq("file_hash", fileHash)
      .eq("status", "ready")
      .maybeSingle();

    if (existing) {
      console.log(`Skipped: ${file} (Already ingested, ${existing.chunk_count} chunks)`);
      totalChunks += existing.chunk_count;
      continue;
    }

    console.log("Extracting text via pdf-parse...");
    const pdfData = await pdf(fileBuffer);
    const text = pdfData.text;

    if (!text || text.trim().length < 100) {
      console.error(`Error: Insufficient text extracted for ${file}`);
      continue;
    }

    console.log(`Text extracted: ${text.length} chars. Creating doc record...`);
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
      console.error(`Error creating document record for ${file}:`, docErr);
      continue;
    }

    console.log(`Chunking text...`);
    const chunks = chunkDocument(text);
    console.log(`Created ${chunks.length} chunks. Embedding...`);

    let embeddings;
    try {
      embeddings = await embedBatch(chunks.map((c) => c.content));
    } catch (e) {
      console.error("Embedding failed:", e);
      await supabase.from("evidence_documents").delete().eq("id", doc.id);
      continue;
    }

    console.log(`Saving ${chunks.length} chunks to Supabase...`);
    const BATCH = 50;
    let hasError = false;
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
        console.error("Error inserting chunks:", chunkErr);
        await supabase.from("evidence_documents").delete().eq("id", doc.id);
        hasError = true;
        break;
      }
    }

    if (hasError) continue;

    console.log(`Marking document as ready...`);
    await supabase
      .from("evidence_documents")
      .update({ status: "ready", chunk_count: chunks.length })
      .eq("id", doc.id);

    console.log(`Success: ${file} (${chunks.length} chunks)`);
    totalChunks += chunks.length;
  }

  console.log(`\nAll done. Total chunks: ${totalChunks}`);
  process.exit(0);
}

run();
