/**
 * Subscription tier feature gates for Apothecare.
 *
 * Free tier is a trial experience (2 queries/day, basic features).
 * Pro tier unlocks the full clinical platform.
 *
 * All server-side enforcement happens here. UI gates import from this file
 * so limits stay consistent across the stack.
 */

import type { NextResponse } from "next/server";

// ── Tier types ───────────────────────────────────────────────────────────

export type SubscriptionTier = "free" | "pro" | "pro_plus" | "enterprise";

// ── Free tier limits ─────────────────────────────────────────────────────

export const FREE_TIER_LIMITS = {
  /** Max active (non-archived) patients */
  max_patients: 5,
  /** Daily clinical query count — enforced by check_and_increment_query() in DB */
  daily_queries: 2,
  /** Conversation history visible to free tier (days) */
  conversation_history_days: 7,
} as const;

// ── Feature availability matrix ──────────────────────────────────────────

export type TierFeature =
  | "labs"
  | "visits"
  | "protocol_generation"
  | "supplement_brands"
  | "branded_exports"
  | "all_evidence_sources"
  | "multi_citation_badges"
  | "unlimited_patients"
  | "full_conversation_history"
  | "partnership_rag"
  | "deep_dive"
  | "multi_phase_protocols"
  | "custom_rag"
  | "deep_research"
  | "patient_education";

const PRO_ONLY_FEATURES: Set<TierFeature> = new Set([
  "labs",
  "visits",
  "protocol_generation",
  "supplement_brands",
  "branded_exports",
  "all_evidence_sources",
  "multi_citation_badges",
  "unlimited_patients",
  "full_conversation_history",
  "partnership_rag",
  "deep_dive",
]);

const PRO_PLUS_ONLY_FEATURES: Set<TierFeature> = new Set([
  "multi_phase_protocols",
  "deep_research",
  "patient_education",
]);

const ENTERPRISE_ONLY_FEATURES: Set<TierFeature> = new Set([
  "custom_rag",
]);

/**
 * Returns true if the given feature is available for the practitioner's tier.
 * Hierarchy: enterprise > pro_plus > pro > free
 */
export function isFeatureAvailable(
  tier: SubscriptionTier | string,
  feature: TierFeature
): boolean {
  if (tier === "enterprise") return true;
  if (tier === "pro_plus") return !ENTERPRISE_ONLY_FEATURES.has(feature);
  if (tier === "pro") return !PRO_PLUS_ONLY_FEATURES.has(feature) && !ENTERPRISE_ONLY_FEATURES.has(feature);
  return !PRO_ONLY_FEATURES.has(feature) && !PRO_PLUS_ONLY_FEATURES.has(feature) && !ENTERPRISE_ONLY_FEATURES.has(feature);
}

// ── Evidence source gating ───────────────────────────────────────────────

/** Sources available to all tiers */
export const FREE_TIER_SOURCES = ["pubmed", "cochrane"] as const;

/** All sources — only available to pro */
export const ALL_SOURCES = [
  "pubmed",
  "cochrane",
  "ifm",
  "a4m",
  "cleveland_clinic",
  "aafp",
  "acp",
  "endocrine_society",
  "acg",
] as const;

/**
 * Filter a source list to only those allowed for the tier.
 * Free tier: pubmed + cochrane only.
 * Pro tier: all sources.
 */
export function filterAllowedSources(
  sources: string[],
  tier: SubscriptionTier | string
): string[] {
  if (tier === "pro" || tier === "pro_plus") return sources;
  return sources.filter((s) =>
    (FREE_TIER_SOURCES as readonly string[]).includes(s)
  );
}

// ── Server-side gate helpers ─────────────────────────────────────────────

const UPGRADE_URL = "/settings#subscription";

/**
 * Standard 403 response for pro-gated features.
 * Import NextResponse from next/server in the calling route.
 */
export function proGateResponse(
  NextResponseRef: typeof NextResponse,
  feature: string
) {
  return NextResponseRef.json(
    {
      error: `${feature} is a Pro feature. Upgrade to access.`,
      upgrade_url: UPGRADE_URL,
      pro_feature: true,
    },
    { status: 403 }
  );
}

/**
 * Standard 403 response for pro-plus-gated features.
 */
export function proPlusGateResponse(
  NextResponseRef: typeof NextResponse,
  feature: string
) {
  return NextResponseRef.json(
    {
      error: `${feature} is a Pro+ feature. Upgrade to Pro+ to access.`,
      upgrade_url: UPGRADE_URL,
      pro_plus_feature: true,
    },
    { status: 403 }
  );
}

/**
 * Check patient count for free tier.
 * Returns an error response if the limit is reached, otherwise null.
 */
export async function checkPatientLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  practitionerId: string,
  tier: SubscriptionTier | string,
  NextResponseRef: typeof NextResponse
): Promise<ReturnType<typeof NextResponse.json> | null> {
  if (tier === "pro" || tier === "pro_plus") return null;

  const { count } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("practitioner_id", practitionerId)
    .eq("is_archived", false);

  if ((count ?? 0) >= FREE_TIER_LIMITS.max_patients) {
    return NextResponseRef.json(
      {
        error: `Free tier is limited to ${FREE_TIER_LIMITS.max_patients} active patients. Archive existing patients or upgrade to Pro for unlimited patient management.`,
        upgrade_url: UPGRADE_URL,
        pro_feature: true,
        limit: FREE_TIER_LIMITS.max_patients,
        current: count,
      },
      { status: 403 }
    );
  }
  return null;
}
