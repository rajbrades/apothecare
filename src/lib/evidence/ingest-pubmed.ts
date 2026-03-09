/**
 * PubMed Ingestion Service
 *
 * Fetches articles from NCBI E-utilities (esearch + efetch),
 * parses XML responses, and stores them in evidence_documents.
 * Chunking and embedding happen via chunk-embed.ts.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { chunkAndEmbedDocument } from "./chunk-embed";

// ── Types ──────────────────────────────────────────────────────────────────

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publishedDate: string | null; // YYYY-MM-DD
  doi: string | null;
  abstract: string | null;
  meshTerms: string[];
}

export interface IngestionResult {
  ingested: number;
  skipped: number;
  errors: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const RATE_LIMIT_MS = 350; // ~3 req/s without API key

function getApiKeyParam(): string {
  const key = env.NCBI_API_KEY;
  return key ? `&api_key=${key}` : "";
}

// ── PubMed Search ──────────────────────────────────────────────────────────

/**
 * Search PubMed and return a list of PMIDs.
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 50
): Promise<string[]> {
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmax: String(maxResults),
    retmode: "json",
    sort: "relevance",
  });

  const url = `${EUTILS_BASE}/esearch.fcgi?${params}${getApiKeyParam()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PubMed esearch failed: ${response.status}`);
  }

  const data = await response.json();
  return data.esearchresult?.idlist ?? [];
}

// ── PubMed Fetch ───────────────────────────────────────────────────────────

/**
 * Fetch article metadata and abstracts for a list of PMIDs.
 * Processes in batches of 200 (NCBI limit).
 */
export async function fetchPubMedArticles(
  pmids: string[]
): Promise<PubMedArticle[]> {
  const articles: PubMedArticle[] = [];
  const batchSize = 200;

  for (let i = 0; i < pmids.length; i += batchSize) {
    const batch = pmids.slice(i, i + batchSize);
    const params = new URLSearchParams({
      db: "pubmed",
      id: batch.join(","),
      rettype: "xml",
      retmode: "xml",
    });

    const url = `${EUTILS_BASE}/efetch.fcgi?${params}${getApiKeyParam()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`PubMed efetch failed: ${response.status}`);
    }

    const xml = await response.text();
    const parsed = parsePubMedXml(xml);
    articles.push(...parsed);

    // Rate limit between batches
    if (i + batchSize < pmids.length) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  return articles;
}

// ── XML Parsing ────────────────────────────────────────────────────────────

/**
 * Parse PubMed XML efetch response into structured articles.
 * Uses regex-based parsing (no XML library dependency).
 */
function parsePubMedXml(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  // Split by <PubmedArticle> tags
  const articleBlocks = xml.split(/<PubmedArticle[^>]*>/);

  for (const block of articleBlocks) {
    if (!block.includes("</PubmedArticle>")) continue;

    const pmid = extractTag(block, "PMID");
    const title = extractTag(block, "ArticleTitle");
    if (!pmid || !title) continue;

    // Authors
    const authors: string[] = [];
    const authorMatches = block.matchAll(
      /<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?(?:<ForeName>(.*?)<\/ForeName>)?[\s\S]*?<\/Author>/g
    );
    for (const match of authorMatches) {
      const lastName = match[1];
      const foreName = match[2];
      authors.push(foreName ? `${lastName} ${foreName.charAt(0)}` : lastName);
    }

    // Journal
    const journal = extractTag(block, "Title") || extractTag(block, "ISOAbbreviation") || "";

    // Publication date
    let publishedDate: string | null = null;
    const yearMatch = block.match(
      /<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>(?:[\s\S]*?<Month>(\w+)<\/Month>)?(?:[\s\S]*?<Day>(\d+)<\/Day>)?/
    );
    if (yearMatch) {
      const year = yearMatch[1];
      const month = monthToNum(yearMatch[2]) || "01";
      const day = yearMatch[3]?.padStart(2, "0") || "01";
      publishedDate = `${year}-${month}-${day}`;
    }

    // DOI
    let doi: string | null = null;
    const doiMatch = block.match(
      /<ArticleId IdType="doi">(.*?)<\/ArticleId>/
    );
    if (doiMatch) doi = doiMatch[1];

    // Abstract
    let abstract: string | null = null;
    const abstractMatch = block.match(
      /<Abstract>([\s\S]*?)<\/Abstract>/
    );
    if (abstractMatch) {
      // Handle structured abstracts with <AbstractText Label="...">
      abstract = abstractMatch[1]
        .replace(/<AbstractText[^>]*Label="([^"]*)"[^>]*>/g, "\n$1: ")
        .replace(/<\/?AbstractText[^>]*>/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    // MeSH terms
    const meshTerms: string[] = [];
    const meshMatches = block.matchAll(
      /<DescriptorName[^>]*>(.*?)<\/DescriptorName>/g
    );
    for (const match of meshMatches) {
      meshTerms.push(match[1]);
    }

    articles.push({
      pmid,
      title: cleanHtml(title),
      authors,
      journal,
      publishedDate,
      doi,
      abstract,
      meshTerms,
    });
  }

  return articles;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, "s"));
  return match ? cleanHtml(match[1]) : null;
}

function cleanHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

function monthToNum(month: string | undefined): string | null {
  if (!month) return null;
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  return months[month] || month.padStart(2, "0");
}

// ── MeSH → Topics/Conditions/Interventions Mapping ─────────────────────────

/** Map MeSH descriptors to our topics/conditions/interventions arrays. */
function categorizeMeshTerms(meshTerms: string[]): {
  topics: string[];
  conditions: string[];
  interventions: string[];
} {
  const topics: string[] = [];
  const conditions: string[] = [];
  const interventions: string[] = [];

  const lower = meshTerms.map((t) => t.toLowerCase());

  // Conditions: disease/disorder-like MeSH terms
  const conditionKeywords = [
    "disease", "disorder", "syndrome", "deficiency", "inflammation",
    "infection", "neoplasm", "cancer", "diabetes", "hypothyroid",
    "hyperthyroid", "autoimmune", "allergy", "anemia", "obesity",
    "hypertension", "dysbiosis",
  ];

  // Interventions: treatment-like MeSH terms
  const interventionKeywords = [
    "therapy", "treatment", "supplementation", "diet", "exercise",
    "administration", "dosage", "drug", "medication", "protocol",
    "probiotics", "prebiotics", "vitamin", "mineral",
  ];

  for (let i = 0; i < meshTerms.length; i++) {
    const term = meshTerms[i];
    const lowerTerm = lower[i];

    const isCondition = conditionKeywords.some((k) => lowerTerm.includes(k));
    const isIntervention = interventionKeywords.some((k) => lowerTerm.includes(k));

    if (isCondition) conditions.push(term.toLowerCase().replace(/\s+/g, "_"));
    else if (isIntervention) interventions.push(term.toLowerCase().replace(/\s+/g, "_"));
    else topics.push(term.toLowerCase().replace(/\s+/g, "_"));
  }

  return { topics, conditions, interventions };
}

// ── Evidence Level Classification ──────────────────────────────────────────

/** Classify evidence level from title and publication type. */
function classifyFromTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("meta-analysis") || lower.includes("meta analysis")) return "meta_analysis";
  if (lower.includes("systematic review")) return "meta_analysis";
  if (lower.includes("randomized") || lower.includes("randomised") || lower.includes("rct")) return "rct";
  if (lower.includes("cohort")) return "cohort_study";
  if (lower.includes("case-control") || lower.includes("case control")) return "case_study";
  if (lower.includes("clinical guideline") || lower.includes("practice guideline") || lower.includes("consensus")) return "clinical_guideline";
  if (lower.includes("in vitro") || lower.includes("cell culture")) return "in_vitro";
  if (lower.includes("case report") || lower.includes("case series")) return "case_study";
  return "other";
}

// ── Ingestion Orchestrator ────────────────────────────────────────────────

/**
 * Ingest PubMed articles into evidence_documents + evidence_chunks.
 * Skips articles that already exist (by source_id = PMID).
 */
export async function ingestArticles(
  articles: PubMedArticle[],
  sourceLabel: string = "pubmed"
): Promise<IngestionResult> {
  const supabase = createServiceClient();
  let ingested = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      // Skip if abstract is missing — not useful for RAG
      if (!article.abstract) {
        skipped++;
        continue;
      }

      // Check for duplicate by PMID
      const { data: existing } = await supabase
        .from("evidence_documents")
        .select("id")
        .eq("source", sourceLabel)
        .eq("doi", article.doi || `pmid:${article.pmid}`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { topics, conditions, interventions } = categorizeMeshTerms(article.meshTerms);
      const evidenceLevel = classifyFromTitle(article.title);

      // Insert evidence_document
      const { data: doc, error: docError } = await supabase
        .from("evidence_documents")
        .insert({
          source: sourceLabel,
          title: article.title,
          authors: article.authors,
          publication: article.journal,
          published_date: article.publishedDate,
          doi: article.doi,
          url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
          abstract: article.abstract,
          evidence_level: evidenceLevel,
          topics,
          conditions,
          interventions,
        })
        .select("id, title, abstract")
        .single();

      if (docError) {
        errors.push(`PMID ${article.pmid}: ${docError.message}`);
        continue;
      }

      // Chunk and embed
      await chunkAndEmbedDocument({
        id: doc.id,
        title: doc.title,
        abstract: doc.abstract,
        fullText: null,
      });

      ingested++;

      // Rate limit to avoid overwhelming Supabase/OpenAI
      await sleep(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`PMID ${article.pmid}: ${msg}`);
    }
  }

  return { ingested, skipped, errors };
}

/**
 * Full pipeline: search PubMed → fetch articles → ingest into DB.
 */
export async function ingestFromPubMedQuery(
  query: string,
  maxResults: number = 50,
  sourceLabel: string = "pubmed"
): Promise<IngestionResult> {
  console.log(`[Evidence] Searching PubMed: "${query}" (max ${maxResults})`);
  const pmids = await searchPubMed(query, maxResults);
  console.log(`[Evidence] Found ${pmids.length} PMIDs`);

  if (pmids.length === 0) {
    return { ingested: 0, skipped: 0, errors: [] };
  }

  const articles = await fetchPubMedArticles(pmids);
  console.log(`[Evidence] Fetched ${articles.length} articles`);

  const result = await ingestArticles(articles, sourceLabel);
  console.log(
    `[Evidence] Ingested: ${result.ingested}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`
  );

  return result;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
