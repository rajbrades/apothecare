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
    "maf assessment guide": {
      topics: ["maf_assessment", "metabolic_assessment_form", "category_keys", "blood_chemistry_interpretation", "functional_assessment"],
      conditions: ["metabolic_dysfunction", "gi_symptoms", "endocrine_dysfunction", "neurological_symptoms"],
      interventions: ["apex_energetics_products", "metabolic_support", "clinical_assessment"],
    },
    "gi & digestive": {
      topics: ["gi_health", "colon", "intestinal_barrier", "leaky_gut", "chemical_tolerance", "stomach", "hcl", "pancreas", "digestive_enzymes"],
      conditions: ["leaky_gut", "ibs", "dysbiosis", "hypochlorhydria", "pancreatic_insufficiency", "food_sensitivities", "chemical_sensitivity", "sibo"],
      interventions: ["apex_energetics_products", "repairvite", "strengtia", "gastrazyme", "bilemin", "dipan_9", "glutagenics"],
    },
    "hepatobiliary & metabolic": {
      topics: ["liver", "biliary", "gallbladder", "bile", "blood_sugar", "insulin_resistance", "sugar_metabolism", "small_intestine"],
      conditions: ["biliary_stasis", "liver_congestion", "blood_sugar_dysregulation", "insulin_resistance", "hypoglycemia", "hyperglycemia", "metabolic_syndrome"],
      interventions: ["apex_energetics_products", "livotrit_plus", "bilemin", "glucobalance", "adaptocrine", "adrenacalm"],
    },
    "endocrine & hormonal": {
      topics: ["adrenal", "thyroid", "pituitary", "hpa_axis", "andropause", "menopause", "estrogen", "testosterone", "cortisol", "dhea", "hormonal_balance"],
      conditions: ["adrenal_fatigue", "adrenal_dysfunction", "hypothyroidism", "hyperthyroidism", "andropause", "menopause", "hormonal_imbalance", "pituitary_dysfunction"],
      interventions: ["apex_energetics_products", "adaptocrine", "adrenacalm", "thyrocsin", "x_flam", "testanex", "femicrine", "pituitrophin"],
    },
    "pharmaceutical interactions": {
      topics: ["drug_nutrient_interactions", "pharmaceutical_considerations", "cortisone", "diuretics", "hormones", "nsaids", "insulin_management", "anxiety_medications", "cholesterol_lowering", "oral_contraceptives", "dietary_guidance"],
      conditions: ["medication_side_effects", "drug_nutrient_depletion", "polypharmacy"],
      interventions: ["dietary_protocols", "nutrient_repletion", "food_therapy"],
    },
    "product dosing": {
      topics: ["apex_energetics_dosing", "supplement_protocols", "product_dosing", "nutritional_support_dosing"],
      conditions: ["adrenal_dysfunction", "thyroid_dysfunction", "gi_dysfunction", "hormonal_imbalance", "blood_sugar_dysregulation", "biliary_stasis", "electrolyte_imbalance"],
      interventions: ["apex_energetics_products", "adaptocrine", "adrenacalm", "thyrocsin", "repairvite", "strengtia", "gastrazyme", "bilemin", "glucobalance", "livotrit_plus", "dipan_9", "nitric_balance", "turmero", "clearvite", "x_flam"],
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
    "thyroid physiology": {
      topics: ["thyroid_physiology", "thyroid_biochemistry", "tsh", "t3", "t4", "thyroid_hormone_synthesis", "hypothyroidism_patterns", "thyroid_prevalence", "functional_hypothyroidism"],
      conditions: ["hypothyroidism", "subclinical_hypothyroidism", "thyroid_hormone_resistance", "conversion_disorder"],
      interventions: ["thyroid_assessment", "tsh_interpretation", "functional_thyroid_evaluation"],
    },
    "thyroid autoimmunity": {
      topics: ["thyroid_autoimmunity", "hashimotos", "autoimmune_thyroid", "thyroid_antibodies", "tpo_antibodies", "thyroglobulin_antibodies", "gut_thyroid_connection", "leaky_gut", "intestinal_permeability", "molecular_mimicry"],
      conditions: ["hashimotos_thyroiditis", "autoimmune_thyroiditis", "leaky_gut", "gluten_sensitivity", "celiac_thyroid"],
      interventions: ["gluten_free_diet", "gut_repair", "immune_modulation", "autoimmune_dietary_protocol"],
    },
    "thyroid clinical assessment": {
      topics: ["thyroid_lab_interpretation", "thyroid_markers", "anemia_thyroid", "vitamin_d_thyroid", "thyroid_hormone_replacement", "liver_thyroid_recycling", "dietary_interventions_thyroid", "case_studies"],
      conditions: ["thyroid_anemia", "vitamin_d_deficiency", "liver_congestion", "gallbladder_dysfunction", "thyroid_medication_management"],
      interventions: ["apex_energetics_products", "thyroid_hormone_replacement", "nutritional_support", "dietary_interventions", "thyrocsin", "liver_support"],
    },
    "thyroid & neurochemistry": {
      topics: ["thyroid_neurotransmitters", "dopamine_thyroid", "serotonin_thyroid", "acetylcholine_thyroid", "brain_thyroid_axis", "neurochemistry"],
      conditions: ["neurotransmitter_imbalance", "dopamine_deficiency", "serotonin_deficiency", "brain_fog_thyroid", "depression_thyroid", "cognitive_decline_thyroid"],
      interventions: ["apex_energetics_products", "neurotransmitter_support", "dopamine_support", "serotonin_support"],
    },
    "thyroid evaluation": {
      topics: ["thyroid_evaluation", "thyroid_patterns", "24_thyroid_patterns", "thyroid_patient_presentation", "clinical_thyroid_assessment", "thyroid_differential_diagnosis"],
      conditions: ["hypothyroidism", "hyperthyroidism", "hashimotos_thyroiditis", "subclinical_hypothyroidism", "thyroid_resistance", "pituitary_hypothyroidism", "tbg_elevation"],
      interventions: ["apex_energetics_products", "thyroid_protocol_selection", "pattern_based_treatment"],
    },
    "thyroid references": {
      topics: ["thyroid_research", "thyroid_bibliography", "case_studies"],
      conditions: ["hypothyroidism", "hashimotos_thyroiditis"],
      interventions: ["evidence_based_thyroid_management"],
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
