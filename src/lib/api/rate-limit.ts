import { SupabaseClient } from "@supabase/supabase-js";
import { SubscriptionTier } from "@/types/database";

// ── Action Types ────────────────────────────────────────────────────────

export type RateLimitAction =
  | "visit_generate"
  | "visit_scribe"
  | "visit_transcribe"
  | "lab_upload"
  | "doc_extract"
  | "supplement_review"
  | "interaction_check";

// ── Configuration ───────────────────────────────────────────────────────

interface RateLimitConfig {
  free: number;
  pro: number;
  window: string; // PostgreSQL interval string
}

const RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  visit_generate:   { free: 5,   pro: 100, window: "1 day" },
  visit_scribe:     { free: 10,  pro: 100, window: "1 day" },
  visit_transcribe: { free: 10,  pro: 200, window: "1 day" },
  lab_upload:       { free: 3,   pro: 50,  window: "1 day" },
  doc_extract:      { free: 10,  pro: 100, window: "1 day" },
  supplement_review:{ free: 5,   pro: 50,  window: "1 day" },
  interaction_check:{ free: 10,  pro: 100, window: "1 day" },
};

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Check whether a practitioner is within their rate limit for the given action.
 *
 * Usage (mirrors validateCsrf pattern):
 *   const rateLimitError = await checkRateLimit(supabase, practitioner.id, practitioner.subscription_tier, "visit_generate");
 *   if (rateLimitError) return rateLimitError;
 *
 * @returns null if the request is allowed, or a 429 Response if the limit is exceeded.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  practitionerId: string,
  subscriptionTier: SubscriptionTier,
  action: RateLimitAction
): Promise<Response | null> {
  const config = RATE_LIMITS[action];
  if (!config) return null;

  const maxCount = subscriptionTier === "pro" ? config.pro : config.free;

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_practitioner_id: practitionerId,
    p_action: action,
    p_max_count: maxCount,
    p_window_interval: config.window,
  });

  if (error) {
    // Fail open: do not block users due to rate limit infrastructure errors.
    console.error(`Rate limit check failed for ${action}:`, error);
    return null;
  }

  if (!data?.allowed) {
    const resetAt = new Date(data.reset_at);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((resetAt.getTime() - Date.now()) / 1000)
    );

    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        action,
        remaining: 0,
        reset_at: data.reset_at,
        limit: maxCount,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(maxCount),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": data.reset_at,
        },
      }
    );
  }

  return null;
}
