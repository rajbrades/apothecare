/**
 * CLI script to ingest Apex Energetics "Mastering the Thyroid" PDFs.
 *
 * Usage:
 *   npx tsx scripts/ingest-apex.ts
 */

import { resolve } from "path";
import { readdir } from "fs/promises";

// Load env before anything else
import "dotenv/config";

// We need to set up the env module manually since we're outside Next.js
(process.env as Record<string, string | undefined>).NODE_ENV = process.env.NODE_ENV || "development";

async function main() {
  // Dynamic import after env is loaded
  const { ingestDocument } = await import("../src/lib/rag/ingest");
  const { createServiceClient } = await import("../src/lib/supabase/server");

  const supabase = createServiceClient();

  // Get partnership ID for Apex Energetics
  const { data: partnership, error: pErr } = await supabase
    .from("partnerships")
    .select("id")
    .eq("slug", "apex-energetics")
    .single();

  if (pErr || !partnership) {
    console.error("Apex Energetics partnership not found. Run migration 024 first.");
    console.error("Error:", pErr?.message);
    process.exit(1);
  }

  console.log(`\n🔬 Apex Energetics Partnership ID: ${partnership.id}\n`);

  // Find all PDFs
  const docsDir = resolve(__dirname, "../docs/partnerships/apex-energetics");
  const files = (await readdir(docsDir)).filter((f) => f.endsWith(".pdf"));

  if (files.length === 0) {
    console.error(`No PDFs found in ${docsDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} PDFs to ingest:\n`);
  files.forEach((f) => console.log(`  • ${f}`));
  console.log();

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
    // Default fallback
    return FILE_METADATA["thyroid"];
  }

  const results = [];

  for (const file of files) {
    const filePath = resolve(docsDir, file);

    // Derive a title from the filename
    const title = file
      .replace(/\.pdf$/i, "")
      .replace(/[-_]/g, " ");

    const meta = getMetadata(file);
    console.log(`\n━━━ Ingesting: ${title} ━━━`);

    const result = await ingestDocument({
      filePath,
      title,
      partnershipId: partnership.id,
      source: "apex_energetics",
      documentType: "masterclass",
      topics: meta.topics,
      conditions: meta.conditions,
      interventions: meta.interventions,
    });

    results.push(result);

    if (result.status === "error") {
      console.error(`  ✗ Error: ${result.error}`);
    } else {
      console.log(`  ✓ ${result.chunkCount} chunks stored`);
    }
  }

  console.log("\n\n═══ INGESTION SUMMARY ═══");
  const totalChunks = results.reduce((sum, r) => sum + r.chunkCount, 0);
  const successes = results.filter((r) => r.status === "ready").length;
  const failures = results.filter((r) => r.status === "error").length;
  console.log(`  Documents: ${results.length} (${successes} ok, ${failures} failed)`);
  console.log(`  Total chunks: ${totalChunks}`);
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
