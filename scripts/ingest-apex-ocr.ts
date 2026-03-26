/**
 * Local OCR ingestion script for image-based Apex Energetics PDFs.
 * Uses Anthropic's native PDF support to extract text, then chunks,
 * embeds, and writes directly to Supabase.
 *
 * Run: npx tsx scripts/ingest-apex-ocr.ts
 */

import { readFile, readdir } from "fs/promises";
import { resolve } from "path";
import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const PARTNERSHIP_SLUG = "apex-energetics";
const DOCS_DIR = resolve(process.cwd(), `docs/partnerships/${PARTNERSHIP_SLUG}`);
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;
const EMBED_BATCH_SIZE = 50;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function chunkText(text: string): { content: string; chunkIndex: number }[] {
  const words = text.split(/\s+/);
  const chunks: { content: string; chunkIndex: number }[] = [];
  let i = 0;
  let idx = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.trim().length > 50) {
      chunks.push({ content: chunk, chunkIndex: idx++ });
    }
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    embeddings.push(...res.data.map((d) => d.embedding));
  }
  return embeddings;
}

const PAGE_BATCH_SIZE = 5; // pages per Claude request
const MAX_BASE64_BYTES = 4 * 1024 * 1024; // 4MB base64 limit per request

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function extractPageBatch(pageBuffers: Buffer[], batchNum: number): Promise<string> {
  // If batch fits in one request, send as single PDF
  // Otherwise split further (shouldn't be needed with PAGE_BATCH_SIZE=5)
  const pdfDoc = await PDFDocument.create();
  for (const buf of pageBuffers) {
    const srcDoc = await PDFDocument.load(buf);
    const [page] = await pdfDoc.copyPages(srcDoc, [0]);
    pdfDoc.addPage(page);
  }
  const batchBytes = await pdfDoc.save();
  const base64 = Buffer.from(batchBytes).toString("base64");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          } as any,
          {
            type: "text",
            text: "Extract all text content from this PDF exactly as written. Include all headings, body text, bullet points, and captions. Do not summarize — output the raw text in reading order. No commentary.",
          },
        ],
      },
    ],
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as any).text)
    .join("\n");
}

async function extractTextWithClaude(pdfBuffer: Buffer, filename: string): Promise<string> {
  // Load the source PDF and split into single-page PDFs
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = srcDoc.getPageCount();
  console.log(`  [OCR] ${filename}: ${totalPages} pages, splitting into batches of ${PAGE_BATCH_SIZE}...`);

  const pageBuffers: Buffer[] = [];
  for (let i = 0; i < totalPages; i++) {
    const singleDoc = await PDFDocument.create();
    const [page] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(page);
    pageBuffers.push(Buffer.from(await singleDoc.save()));
  }

  // Process in batches with retry + delay
  const allText: string[] = [];
  const totalBatches = Math.ceil(totalPages / PAGE_BATCH_SIZE);
  for (let i = 0; i < pageBuffers.length; i += PAGE_BATCH_SIZE) {
    const batch = pageBuffers.slice(i, i + PAGE_BATCH_SIZE);
    const batchNum = Math.floor(i / PAGE_BATCH_SIZE) + 1;
    process.stdout.write(`  [OCR] Batch ${batchNum}/${totalBatches} (pages ${i + 1}–${Math.min(i + PAGE_BATCH_SIZE, totalPages)})...`);

    let text = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        text = await extractPageBatch(batch, batchNum);
        break;
      } catch (err: any) {
        if (attempt === 3) {
          process.stdout.write(` FAILED after 3 attempts, skipping\n`);
          text = "";
          break;
        }
        process.stdout.write(` retry ${attempt}...`);
        await sleep(3000 * attempt);
      }
    }

    allText.push(text);
    process.stdout.write(` ${text.length} chars\n`);
    // Pause between batches to avoid hammering the API
    if (i + PAGE_BATCH_SIZE < pageBuffers.length) await sleep(1500);
  }

  const combined = allText.join("\n\n");
  console.log(`  [OCR] Total extracted: ${combined.length} characters`);
  return combined;
}

async function main() {
  console.log("=== Apex Energetics RAG Ingestion (OCR mode) ===\n");

  // Get partnership ID
  const { data: partnership, error: pErr } = await supabase
    .from("partnerships")
    .select("id, name")
    .eq("slug", PARTNERSHIP_SLUG)
    .single();

  if (pErr || !partnership) {
    console.error("Partnership not found. Run migration 024 first.");
    process.exit(1);
  }

  console.log(`Partnership: ${partnership.name} (${partnership.id})\n`);

  const files = (await readdir(DOCS_DIR)).filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`Found ${files.length} PDFs\n`);

  // Per-file metadata — matched to actual PDF content
  const FILE_METADATA: Record<string, { topics: string[]; conditions: string[]; interventions: string[] }> = {
    "blood chemistry": {
      topics: ["cbc", "complete_blood_count", "blood_chemistry", "functional_blood_chemistry", "rbc", "wbc", "hemoglobin", "hematocrit", "platelets", "differential", "iron_studies", "metabolic_panel", "lipid_panel", "liver_function", "kidney_function", "thyroid_panel", "electrolytes"],
      conditions: ["anemia", "iron_deficiency", "b12_deficiency", "folate_deficiency", "infection", "inflammation", "leukocytosis", "leukopenia", "thrombocytopenia", "polycythemia", "hypothyroidism", "hyperthyroidism", "diabetes", "insulin_resistance", "dyslipidemia", "liver_disease", "kidney_disease"],
      interventions: ["iron", "b12", "folate", "vitamin_d", "zinc", "selenium", "omega_3", "magnesium", "functional_ranges", "optimal_ranges"],
    },
    "metabolic assessment": {
      topics: ["metabolic_assessment", "symptom_questionnaire", "functional_assessment", "patient_intake", "review_of_systems"],
      conditions: ["metabolic_dysfunction", "gi_symptoms", "fatigue", "hormonal_imbalance", "neurological_symptoms", "cardiovascular_symptoms"],
      interventions: ["metabolic_support", "symptom_tracking", "patient_assessment"],
    },
    "laboratory evaluation": {
      topics: ["functional_lab_ranges", "optimal_ranges", "blood_chemistry", "cbc", "metabolic_panel", "lipid_panel", "liver_function", "kidney_function", "thyroid_panel", "electrolytes", "iron_studies"],
      conditions: ["anemia", "hypothyroidism", "hyperthyroidism", "diabetes", "insulin_resistance", "liver_disease", "kidney_disease", "dyslipidemia", "electrolyte_imbalance"],
      interventions: ["functional_ranges", "optimal_ranges", "lab_interpretation"],
    },
    "clinical category": {
      topics: ["clinical_interpretation", "blood_chemistry_categories", "intestinal_barrier", "biliary", "blood_sugar", "thyroid", "adrenal", "electrolyte_balance", "menopausal", "prostate", "pituitary"],
      conditions: ["leaky_gut", "biliary_stasis", "blood_sugar_dysregulation", "hypothyroidism", "adrenal_dysfunction", "electrolyte_imbalance", "hormonal_imbalance"],
      interventions: ["apex_energetics_products", "nutritional_protocols", "dietary_interventions", "supplement_dosing"],
    },
    "neurotransmitter assessment": {
      topics: ["neurotransmitter_assessment", "ntap", "mood", "cognition", "sleep", "stress", "autonomic_function", "brain_health"],
      conditions: ["depression", "anxiety", "insomnia", "cognitive_decline", "stress_response", "autonomic_dysfunction", "neurotransmitter_imbalance"],
      interventions: ["neurotransmitter_support", "mood_support", "sleep_support", "stress_management"],
    },
    "neurotransmitter nutritional": {
      topics: ["neurotransmitter_protocols", "nutritional_key", "brain_health", "mood_support", "cognitive_support"],
      conditions: ["serotonin_deficiency", "dopamine_deficiency", "gaba_deficiency", "acetylcholine_deficiency", "catecholamine_imbalance"],
      interventions: ["apex_energetics_products", "5_htp", "tyrosine", "gaba", "phosphatidylserine", "acetyl_l_carnitine", "b_vitamins"],
    },
    "thyroid": {
      topics: ["thyroid", "hypothyroidism", "hashimotos", "thyroid_antibodies", "t3", "t4", "tsh"],
      conditions: ["hypothyroidism", "hashimotos_thyroiditis", "hyperthyroidism", "subclinical_hypothyroidism"],
      interventions: ["selenium", "iodine", "zinc", "vitamin_d", "ashwagandha", "thyroid_support"],
    },
  };

  function getMetadata(filename: string) {
    const lower = filename.toLowerCase();
    for (const [key, meta] of Object.entries(FILE_METADATA)) {
      if (lower.includes(key)) return meta;
    }
    return FILE_METADATA["thyroid"];
  }

  for (const file of files) {
    const filePath = resolve(DOCS_DIR, file);
    const title = file.replace(/\.pdf$/i, "");
    console.log(`\nProcessing: ${file}`);

    const fileBuffer = await readFile(filePath);
    const fileHash = createHash("sha256").update(fileBuffer).digest("hex");

    // Skip if already ingested with sufficient chunks
    const { data: existing } = await supabase
      .from("evidence_documents")
      .select("id, chunk_count")
      .eq("file_hash", fileHash)
      .eq("status", "ready")
      .gte("chunk_count", 20)
      .maybeSingle();

    if (existing) {
      console.log(`  Skipped — already ingested (${existing.chunk_count} chunks)`);
      continue;
    }

    // Delete any previous attempts (including low-quality ready ones with < 5 chunks)
    const { data: prevDocs } = await supabase
      .from("evidence_documents")
      .select("id, status, chunk_count")
      .eq("file_hash", fileHash);

    for (const prev of prevDocs || []) {
      if (prev.status !== "ready" || (prev.chunk_count ?? 0) < 20) {
        await supabase.from("evidence_chunks").delete().eq("document_id", prev.id);
        await supabase.from("evidence_documents").delete().eq("id", prev.id);
        console.log(`  Deleted previous entry (status: ${prev.status}, chunks: ${prev.chunk_count})`);
      }
    }

    // OCR via Claude
    const text = await extractTextWithClaude(fileBuffer, file);

    if (!text || text.trim().length < 100) {
      console.error(`  Error: insufficient text extracted`);
      continue;
    }

    // Create document record
    const meta = getMetadata(file);
    const { data: doc, error: docErr } = await supabase
      .from("evidence_documents")
      .insert({
        source: PARTNERSHIP_SLUG.replace(/-/g, "_"),
        title,
        partnership_id: partnership.id,
        document_type: "masterclass",
        file_hash: fileHash,
        storage_path: `docs/partnerships/${PARTNERSHIP_SLUG}/${file}`,
        status: "processing",
        topics: meta.topics,
        conditions: meta.conditions,
        interventions: meta.interventions,
      })
      .select("id")
      .single();

    if (docErr || !doc) {
      console.error(`  Error creating document record:`, docErr?.message);
      continue;
    }

    // Chunk
    const chunks = chunkText(text);
    console.log(`  Chunked into ${chunks.length} pieces`);

    // Embed
    console.log(`  Embedding ${chunks.length} chunks via OpenAI...`);
    const embeddings = await embedBatch(chunks.map((c) => c.content));

    // Insert chunks in batches
    let insertedCount = 0;
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE).map((chunk, j) => ({
        document_id: doc.id,
        content: chunk.content,
        chunk_index: chunk.chunkIndex,
        embedding: JSON.stringify(embeddings[i + j]),
      }));

      const { error: chunkErr } = await supabase.from("evidence_chunks").insert(batch);
      if (chunkErr) {
        console.error(`  Error inserting chunks:`, chunkErr.message);
        await supabase.from("evidence_documents").delete().eq("id", doc.id);
        break;
      }
      insertedCount += batch.length;
    }

    if (insertedCount === chunks.length) {
      await supabase
        .from("evidence_documents")
        .update({ status: "ready", chunk_count: chunks.length })
        .eq("id", doc.id);

      console.log(`  Done — ${chunks.length} chunks stored (doc: ${doc.id})`);
    }
  }

  console.log("\n=== Ingestion complete ===");
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
