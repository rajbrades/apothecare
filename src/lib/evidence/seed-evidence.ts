/**
 * Seed Evidence — Pre-populate the evidence base with curated PubMed searches
 *
 * Covers functional medicine core topics, mainstream journals, and
 * key clinical areas. Callable from admin API or CLI.
 */

import { ingestFromPubMedQuery, type IngestionResult } from "./ingest-pubmed";

// ── Seed Query Definitions ────────────────────────────────────────────────

interface SeedQuery {
  query: string;
  maxResults: number;
  category: string; // for logging
}

const SEED_QUERIES: SeedQuery[] = [
  // ── Functional Medicine Core ────────────────────────────────────────
  { query: "functional medicine systematic review", maxResults: 40, category: "FM Core" },
  { query: "Institute for Functional Medicine clinical outcomes", maxResults: 20, category: "FM Core" },
  { query: "systems biology personalized medicine chronic disease", maxResults: 30, category: "FM Core" },

  // ── Gut / Microbiome ────────────────────────────────────────────────
  { query: "gut permeability zonulin autoimmune disease", maxResults: 30, category: "Gut" },
  { query: "microbiome diversity inflammation functional", maxResults: 30, category: "Gut" },
  { query: "SIBO diagnosis treatment systematic review", maxResults: 20, category: "Gut" },
  { query: "leaky gut intestinal permeability clinical evidence", maxResults: 20, category: "Gut" },
  { query: "probiotics clinical outcomes meta-analysis", maxResults: 30, category: "Gut" },

  // ── Thyroid / Endocrine ─────────────────────────────────────────────
  { query: "subclinical hypothyroidism optimal TSH reference range", maxResults: 25, category: "Thyroid" },
  { query: "Hashimoto thyroiditis selenium supplementation", maxResults: 20, category: "Thyroid" },
  { query: "thyroid autoimmunity gluten connection", maxResults: 15, category: "Thyroid" },
  { query: "adrenal dysfunction cortisol HPA axis", maxResults: 25, category: "Endocrine" },
  { query: "DUTCH test cortisol metabolites clinical utility", maxResults: 15, category: "Endocrine" },

  // ── Nutrients / Supplementation ─────────────────────────────────────
  { query: "vitamin D supplementation clinical outcomes meta-analysis", maxResults: 30, category: "Nutrients" },
  { query: "magnesium deficiency clinical manifestations treatment", maxResults: 25, category: "Nutrients" },
  { query: "omega-3 fatty acids inflammation systematic review", maxResults: 25, category: "Nutrients" },
  { query: "B12 methylcobalamin folate MTHFR clinical", maxResults: 20, category: "Nutrients" },
  { query: "iron deficiency ferritin optimal levels", maxResults: 20, category: "Nutrients" },
  { query: "CoQ10 ubiquinol cardiovascular mitochondrial", maxResults: 15, category: "Nutrients" },

  // ── Metabolic / Cardiometabolic ─────────────────────────────────────
  { query: "insulin resistance metabolic syndrome functional approach", maxResults: 25, category: "Metabolic" },
  { query: "advanced lipid testing cardiovascular risk", maxResults: 20, category: "Metabolic" },
  { query: "homocysteine cardiovascular disease methylation", maxResults: 20, category: "Metabolic" },

  // ── Inflammation / Immune ───────────────────────────────────────────
  { query: "chronic inflammation biomarkers hs-CRP clinical significance", maxResults: 20, category: "Inflammation" },
  { query: "autoimmune disease root cause functional medicine", maxResults: 20, category: "Inflammation" },
  { query: "food sensitivity IgG testing clinical evidence", maxResults: 15, category: "Inflammation" },

  // ── Detox / Environmental ───────────────────────────────────────────
  { query: "mycotoxin exposure health effects clinical", maxResults: 15, category: "Environmental" },
  { query: "heavy metal toxicity chelation evidence", maxResults: 15, category: "Environmental" },
  { query: "glutathione detoxification clinical applications", maxResults: 15, category: "Environmental" },

  // ── Mainstream / High-Impact Journals ───────────────────────────────
  { query: "lifestyle intervention chronic disease NEJM", maxResults: 30, category: "Mainstream" },
  { query: "nutrition chronic disease prevention Lancet", maxResults: 30, category: "Mainstream" },
  { query: "integrative medicine evidence JAMA", maxResults: 25, category: "Mainstream" },
  { query: "Mediterranean diet clinical outcomes BMJ", maxResults: 20, category: "Mainstream" },
  { query: "exercise prescription chronic disease systematic review", maxResults: 20, category: "Mainstream" },
  { query: "sleep quality health outcomes meta-analysis", maxResults: 20, category: "Mainstream" },

  // ── Mental Health / Neuro ───────────────────────────────────────────
  { query: "gut brain axis mental health clinical", maxResults: 20, category: "Neuro" },
  { query: "nutritional psychiatry depression anxiety", maxResults: 20, category: "Neuro" },

  // ── Women's Health ──────────────────────────────────────────────────
  { query: "PCOS insulin resistance functional approach", maxResults: 20, category: "Women's Health" },
  { query: "hormone replacement therapy bioidentical evidence", maxResults: 15, category: "Women's Health" },
  { query: "perimenopause symptoms integrative management", maxResults: 15, category: "Women's Health" },
];

// ── Seed Runner ───────────────────────────────────────────────────────────

export interface SeedResult {
  totalIngested: number;
  totalSkipped: number;
  totalErrors: number;
  queryResults: Array<{
    category: string;
    query: string;
    result: IngestionResult;
  }>;
}

/**
 * Run all seed queries sequentially. Returns aggregate results.
 *
 * @param onProgress - Optional callback for progress updates
 */
export async function runSeedIngestion(
  onProgress?: (completed: number, total: number, category: string) => void
): Promise<SeedResult> {
  const queryResults: SeedResult["queryResults"] = [];
  let totalIngested = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let i = 0; i < SEED_QUERIES.length; i++) {
    const sq = SEED_QUERIES[i];
    console.log(`[Seed] (${i + 1}/${SEED_QUERIES.length}) [${sq.category}] "${sq.query}"`);

    onProgress?.(i, SEED_QUERIES.length, sq.category);

    try {
      const result = await ingestFromPubMedQuery(sq.query, sq.maxResults);
      totalIngested += result.ingested;
      totalSkipped += result.skipped;
      totalErrors += result.errors.length;
      queryResults.push({ category: sq.category, query: sq.query, result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Seed] Failed: ${msg}`);
      queryResults.push({
        category: sq.category,
        query: sq.query,
        result: { ingested: 0, skipped: 0, errors: [msg] },
      });
      totalErrors++;
    }

    // Brief pause between queries to respect NCBI rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  onProgress?.(SEED_QUERIES.length, SEED_QUERIES.length, "complete");

  console.log(
    `[Seed] Complete — Ingested: ${totalIngested}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`
  );

  return { totalIngested, totalSkipped, totalErrors, queryResults };
}

export { SEED_QUERIES };
