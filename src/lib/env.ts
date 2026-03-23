import { z } from "zod";

// ---------------------------------------------------------------------------
// Environment variable validation — runs once at startup on the server.
//
// All required vars are declared in .env.example. The schema below mirrors
// that file and will throw a descriptive error at boot time if anything is
// missing or malformed, rather than failing at request time with a cryptic
// "Cannot read properties of undefined" deep inside a handler.
//
// Usage:
//   import { env } from "@/lib/env";
//   const url = env.NEXT_PUBLIC_SUPABASE_URL;
// ---------------------------------------------------------------------------

// Helper: non-empty string (trims whitespace before checking)
const requiredString = z.string().trim().min(1, "must not be empty");

// Helper: valid URL string
const requiredUrl = requiredString.url("must be a valid URL");

const envSchema = z.object({
  // ── Supabase ──────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: requiredUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString,
  SUPABASE_SERVICE_ROLE_KEY: requiredString,

  // ── Anthropic / MiniMax ──────────────────────────────────────────────
  ANTHROPIC_API_KEY: z.string().trim().optional(),
  MINIMAX_API_KEY: z.string().trim().optional(),

  // ── OpenAI (Whisper transcription, embeddings) ─────────────────────
  OPENAI_API_KEY: z.string().trim().optional(),

  // ── NCBI / PubMed (evidence ingestion) ────────────────────────────
  NCBI_API_KEY: z.string().trim().optional(),

  // ── Stripe ────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),

  // ── App ───────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: requiredUrl,
  NEXT_PUBLIC_APP_NAME: requiredString.default("Apothecare"),

  // ── Email (Resend) ─────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().trim().optional(),
  RESEND_FROM_EMAIL: z.string().trim().optional().default("noreply@apothecare.ai"),
  RESEND_FROM_NAME: z.string().trim().optional().default("Apothecare"),

  // ── Admin ─────────────────────────────────────────────────────────────
  ADMIN_EMAILS: z.string().optional(), // Comma-separated list of emails

  // ── Database (used by CLI migration scripts, optional at runtime) ────
  DATABASE_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Parse and cache
// ---------------------------------------------------------------------------
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    // In development, log a highly visible error to the console.
    // In production, we still throw to prevent running with missing config.
    const message = [
      "",
      "========================================",
      " MISSING OR INVALID ENVIRONMENT VARIABLES",
      "========================================",
      formatted,
      "",
      "Check your .env.local file against .env.example.",
      "========================================",
      "",
    ].join("\n");

    throw new Error(message);
  }

  return result.data;
}

/**
 * Validated environment variables.
 *
 * Validation runs lazily on first property access (not at import time),
 * so importing this module during `next build` won't crash when env vars
 * are absent. At runtime, the first access triggers validation exactly
 * once — if any required variable is missing or invalid, the process
 * will crash immediately with a clear diagnostic message.
 */
let _env: Env | undefined;
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!_env) _env = validateEnv();
    return _env[prop as keyof Env];
  },
});
