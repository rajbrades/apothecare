/**
 * Supplement citation validation pipeline.
 *
 * Three-tier validation for AI-generated supplement citations:
 *   Tier 1 — CrossRef: validate DOI exists, fetch real metadata, check relevance
 *   Tier 2 — PubMed:   when DOI is bad/missing, search PubMed for a real paper
 *   Tier 3 — Curated:  check local supplement_evidence table for known-good refs
 *
 * Each supplement gets up to 3 citations, ranked by evidence strength.
 */

import { classifyEvidenceLevel } from "@/lib/chat/classify-evidence";

// ── Types ──────────────────────────────────────────────────────────────────

export interface VerifiedCitation {
  /** DOI URL or PubMed URL */
  doi: string;
  /** Real paper title from CrossRef or PubMed */
  title: string;
  /** Formatted authors, e.g. ["Smith J", "Jones K"] */
  authors?: string[];
  /** Publication year */
  year?: number;
  /** Journal name */
  source?: string;
  /** Evidence level classified from the paper title */
  evidence_level: string;
  /** Where this citation came from */
  origin: "crossref" | "pubmed" | "curated";
}

interface CrossRefWork {
  DOI: string;
  title?: string[];
  author?: Array<{ family?: string; given?: string }>;
  "container-title"?: string[];
  subject?: string[];
  abstract?: string;
  published?: { "date-parts"?: number[][] };
  "published-print"?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
}

interface PubMedSummaryResult {
  uid: string;
  title: string;
  authors: Array<{ name: string }>;
  source: string;
  pubdate: string;
  articleids: Array<{ idtype: string; value: string }>;
}

// ── Constants ──────────────────────────────────────────────────────────────

const CROSSREF_BASE = "https://api.crossref.org/works";
const PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_SUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
const USER_AGENT = "Apothecare/1.0 (https://apothecare.ai; mailto:support@apothecare.ai)";
const TIMEOUT_MS = 5000;

/** Evidence hierarchy — lower index = stronger evidence */
const EVIDENCE_RANK: Record<string, number> = {
  "meta-analysis": 0,
  "meta_analysis": 0,
  rct: 1,
  guideline: 2,
  clinical_guideline: 2,
  cohort: 3,
  cohort_study: 3,
  "case-study": 4,
  case_study: 4,
  expert_consensus: 5,
  in_vitro: 6,
  other: 7,
};

// ── Tier 1: CrossRef validation ────────────────────────────────────────────

/**
 * Validate a DOI via CrossRef and check relevance to the supplement.
 * Returns verified citation data if the paper is real and relevant.
 */
async function validateViaCrossRef(
  doi: string,
  supplementName: string
): Promise<VerifiedCitation | null> {
  const cleanDoi = doi.startsWith("https://doi.org/")
    ? doi.replace("https://doi.org/", "")
    : doi.startsWith("http://doi.org/")
      ? doi.replace("http://doi.org/", "")
      : doi;

  try {
    const res = await fetch(
      `${CROSSREF_BASE}/${encodeURIComponent(cleanDoi)}?mailto=support@apothecare.ai`,
      {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const work: CrossRefWork = data.message;
    if (!work?.DOI) return null;

    const title = work.title?.[0] || "";
    const abstract = stripJatsXml(work.abstract || "");
    const subjects = (work.subject || []).join(" ");

    // Relevance check: does this paper relate to the supplement?
    if (!isRelevant(supplementName, title, abstract, subjects)) {
      console.warn(
        `[Citations] CrossRef DOI ${cleanDoi} is irrelevant to "${supplementName}": "${title}"`
      );
      return null;
    }

    return {
      doi: `https://doi.org/${work.DOI}`,
      title,
      authors: work.author
        ?.map((a) => `${a.family || ""} ${a.given?.charAt(0) || ""}`.trim())
        .filter(Boolean),
      year: getYearFromCrossRef(work),
      source: work["container-title"]?.[0],
      evidence_level: classifyEvidenceLevel(title),
      origin: "crossref",
    };
  } catch (err) {
    console.warn(`[Citations] CrossRef lookup failed for DOI "${cleanDoi}":`, err);
    return null;
  }
}

// ── Tier 2: PubMed search ──────────────────────────────────────────────────

/**
 * Search PubMed for papers matching a supplement name and context.
 * Returns up to `limit` verified citations, sorted by relevance.
 */
async function searchPubMed(
  supplementName: string,
  context: string,
  limit: number = 3
): Promise<VerifiedCitation[]> {
  try {
    const apiKeyParam = process.env.NIH_API_KEY ? `&api_key=${process.env.NIH_API_KEY}` : "";

    // Build a focused search query
    const query = buildPubMedQuery(supplementName, context);

    // Step 1: ESearch — get PMIDs
    const searchUrl = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json&sort=relevance&tool=apothecare&email=support@apothecare.ai${apiKeyParam}`;

    const searchRes = await fetch(searchUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const pmids: string[] = searchData.esearchresult?.idlist || [];
    if (pmids.length === 0) return [];

    // Step 2: ESummary — get metadata (JSON, lighter than EFetch XML)
    const summaryUrl = `${PUBMED_SUMMARY}?db=pubmed&id=${pmids.join(",")}&retmode=json&tool=apothecare&email=support@apothecare.ai${apiKeyParam}`;

    const summaryRes = await fetch(summaryUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!summaryRes.ok) return [];

    const summaryData = await summaryRes.json();
    const results: VerifiedCitation[] = [];

    for (const pmid of pmids) {
      const article: PubMedSummaryResult = summaryData.result?.[pmid];
      if (!article?.title) continue;

      // Extract DOI from article IDs
      const doiEntry = article.articleids?.find((a) => a.idtype === "doi");
      const url = doiEntry?.value
        ? `https://doi.org/${doiEntry.value}`
        : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

      const yearMatch = article.pubdate?.match(/\d{4}/);

      results.push({
        doi: url,
        title: article.title.replace(/\.$/, ""),
        authors: article.authors?.map((a) => a.name).slice(0, 3),
        year: yearMatch ? parseInt(yearMatch[0], 10) : undefined,
        source: article.source,
        evidence_level: classifyEvidenceLevel(article.title),
        origin: "pubmed",
      });
    }

    return results;
  } catch (err) {
    console.warn(`[Citations] PubMed search failed for "${supplementName}":`, err);
    return [];
  }
}

/**
 * Build a PubMed search query from supplement name and clinical context.
 */
function buildPubMedQuery(supplementName: string, context: string): string {
  // Extract medical terms from context (conditions, symptoms)
  const contextTerms = context
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter(
      (w) =>
        !STOP_WORDS.has(w.toLowerCase()) &&
        !SUPPLEMENT_STOP_WORDS.has(w.toLowerCase())
    )
    .slice(0, 3)
    .join(" ");

  // Combine supplement name with context keywords
  const parts = [supplementName];
  if (contextTerms) parts.push(contextTerms);
  parts.push("supplementation");

  return parts.join(" ");
}

// ── Tier 3: Curated evidence lookup ────────────────────────────────────────

/**
 * Look up curated evidence from the supplement_evidence table.
 * This is the most reliable source — human-verified citations.
 */
export async function lookupCuratedEvidence(
  supabase: any,
  supplementName: string,
  limit: number = 3
): Promise<VerifiedCitation[]> {
  try {
    const { data } = await supabase
      .from("supplement_evidence")
      .select("doi, title, authors, year, journal, evidence_level")
      .ilike("supplement_name", `%${supplementName}%`)
      .eq("is_verified", true)
      .order("evidence_rank", { ascending: true })
      .limit(limit);

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      doi: row.doi,
      title: row.title,
      authors: row.authors || [],
      year: row.year,
      source: row.journal,
      evidence_level: row.evidence_level || "cohort",
      origin: "curated" as const,
    }));
  } catch {
    // Table may not exist yet — that's fine
    return [];
  }
}

// ── Main pipeline ──────────────────────────────────────────────────────────

/**
 * Validate and enrich citations for a single supplement review item.
 *
 * Pipeline:
 *   1. Check curated DB for known-good citations
 *   2. If AI provided a DOI, validate via CrossRef
 *   3. Fill remaining slots with PubMed search results
 *   4. Deduplicate, rank by evidence strength, return top 3
 */
export async function validateSupplementCitations(
  item: {
    name: string;
    rationale: string;
    evidence_doi?: string;
    evidence_level?: string;
  },
  supabase?: any
): Promise<VerifiedCitation[]> {
  const citations: VerifiedCitation[] = [];
  const seenDois = new Set<string>();

  // Tier 3: Curated evidence (highest trust, check first)
  if (supabase) {
    const curated = await lookupCuratedEvidence(supabase, item.name, 3);
    for (const c of curated) {
      if (!seenDois.has(c.doi)) {
        citations.push(c);
        seenDois.add(c.doi);
      }
    }
  }

  // Tier 1: Validate AI-provided DOI via CrossRef
  if (item.evidence_doi && citations.length < 3) {
    const verified = await validateViaCrossRef(item.evidence_doi, item.name);
    if (verified && !seenDois.has(verified.doi)) {
      citations.push(verified);
      seenDois.add(verified.doi);
    }
  }

  // Tier 2: PubMed search to fill remaining slots
  const remaining = 3 - citations.length;
  if (remaining > 0) {
    const pubmedResults = await searchPubMed(
      item.name,
      item.rationale,
      remaining + 2 // fetch extra for dedup
    );
    for (const result of pubmedResults) {
      if (citations.length >= 3) break;
      if (!seenDois.has(result.doi)) {
        citations.push(result);
        seenDois.add(result.doi);
      }
    }
  }

  // Sort by evidence strength (strongest first)
  citations.sort((a, b) => {
    const rankA = EVIDENCE_RANK[a.evidence_level] ?? 7;
    const rankB = EVIDENCE_RANK[b.evidence_level] ?? 7;
    return rankA - rankB;
  });

  return citations.slice(0, 3);
}

/**
 * Validate citations for all items in a supplement review.
 * Runs all items in parallel for speed.
 */
export async function validateAllReviewCitations(
  reviewData: Record<string, unknown>,
  supabase?: any
): Promise<void> {
  const allItems = [
    ...((reviewData.items as Array<Record<string, unknown>>) || []),
    ...((reviewData.additions as Array<Record<string, unknown>>) || []),
  ];

  await Promise.all(
    allItems.map(async (item) => {
      const citations = await validateSupplementCitations(
        {
          name: item.name as string,
          rationale: item.rationale as string,
          evidence_doi: item.evidence_doi as string | undefined,
          evidence_level: item.evidence_level as string | undefined,
        },
        supabase
      );

      // Replace AI-hallucinated single DOI with verified citations array
      delete item.evidence_doi;
      delete item.evidence_title;
      item.verified_citations = citations;

      // Set evidence_level from strongest citation if we have any
      if (citations.length > 0) {
        item.evidence_level = citations[0].evidence_level;
      }
    })
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip JATS XML tags from CrossRef abstracts */
function stripJatsXml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Extract publication year from CrossRef date fields */
function getYearFromCrossRef(work: CrossRefWork): number | undefined {
  const dateParts =
    work.published?.["date-parts"]?.[0] ||
    work["published-print"]?.["date-parts"]?.[0] ||
    work["published-online"]?.["date-parts"]?.[0];
  return dateParts?.[0] || undefined;
}

/**
 * Check if a paper is relevant to a supplement by keyword matching.
 * Normalizes both the supplement name and the paper's title/abstract/subjects.
 */
function isRelevant(
  supplementName: string,
  title: string,
  abstract: string,
  subjects: string
): boolean {
  const corpus = `${title} ${abstract} ${subjects}`.toLowerCase();
  const suppLower = supplementName.toLowerCase();

  // Generate search terms from supplement name
  const searchTerms = getSupplementSearchTerms(suppLower);

  // At least one term must appear in the paper's corpus
  return searchTerms.some((term) => corpus.includes(term));
}

/**
 * Generate search terms for a supplement including common aliases.
 * E.g., "Vitamin D3" → ["vitamin d3", "vitamin d", "cholecalciferol", "25-hydroxy"]
 */
function getSupplementSearchTerms(name: string): string[] {
  const terms = [name];

  // Add the first word if multi-word (e.g., "Magnesium Glycinate" → "magnesium")
  const words = name.split(/\s+/);
  if (words.length > 1 && words[0].length > 3) {
    terms.push(words[0]);
  }

  // Common supplement aliases
  const aliases: Record<string, string[]> = {
    "vitamin d": ["cholecalciferol", "ergocalciferol", "25-hydroxy", "calciferol"],
    "vitamin d3": ["cholecalciferol", "vitamin d", "25-hydroxy"],
    "vitamin d2": ["ergocalciferol", "vitamin d"],
    "vitamin b12": ["cobalamin", "methylcobalamin", "cyanocobalamin"],
    "vitamin b6": ["pyridoxine", "pyridoxal"],
    "vitamin b1": ["thiamine", "thiamin"],
    "vitamin b2": ["riboflavin"],
    "vitamin b3": ["niacin", "niacinamide", "nicotinamide"],
    "vitamin b9": ["folate", "folic acid", "methylfolate"],
    "vitamin c": ["ascorbic acid", "ascorbate"],
    "vitamin e": ["tocopherol", "tocotrienol"],
    "vitamin k2": ["menaquinone", "mk-7", "vitamin k"],
    "vitamin k": ["phylloquinone", "menaquinone"],
    "vitamin a": ["retinol", "retinoid", "beta-carotene"],
    "omega-3": ["fish oil", "epa", "dha", "omega 3", "n-3 fatty"],
    "fish oil": ["omega-3", "epa", "dha", "n-3 fatty"],
    "coq10": ["coenzyme q10", "ubiquinol", "ubiquinone"],
    "magnesium": ["mg supplementation", "magnesium"],
    "magnesium glycinate": ["magnesium", "magnesium bisglycinate"],
    "zinc": ["zinc supplementation", "zinc"],
    "iron": ["ferrous", "ferric", "iron supplementation"],
    "selenium": ["selenomethionine", "selenium"],
    "probiotics": ["probiotic", "lactobacillus", "bifidobacterium"],
    "curcumin": ["turmeric", "curcuma"],
    "turmeric": ["curcumin", "curcuma longa"],
    "ashwagandha": ["withania somnifera", "ksm-66"],
    "berberine": ["berberine"],
    "nac": ["n-acetylcysteine", "n-acetyl cysteine"],
    "glutathione": ["gsh", "glutathione"],
    "melatonin": ["melatonin"],
    "saw palmetto": ["serenoa repens"],
    "st. john's wort": ["hypericum perforatum", "st john"],
    "ginkgo": ["ginkgo biloba"],
    "milk thistle": ["silymarin", "silybum marianum"],
    "rhodiola": ["rhodiola rosea"],
    "maca": ["lepidium meyenii"],
    "lion's mane": ["hericium erinaceus"],
    "reishi": ["ganoderma lucidum"],
    "cordyceps": ["cordyceps sinensis", "cordyceps militaris"],
  };

  for (const [key, values] of Object.entries(aliases)) {
    if (name.includes(key)) {
      terms.push(...values);
    }
  }

  return [...new Set(terms)];
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "been",
  "will", "would", "could", "should", "which", "their", "there", "about",
  "also", "more", "other", "than", "into", "some", "only", "when",
  "where", "after", "before", "between", "each", "every", "these",
  "those", "over", "under", "such", "very", "most", "just",
]);

const SUPPLEMENT_STOP_WORDS = new Set([
  "supplement", "supplementation", "daily", "dosage", "dose", "take",
  "taking", "recommend", "recommended", "current", "currently",
  "capsule", "tablet", "softgel", "powder", "liquid",
]);
