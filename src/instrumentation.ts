/**
 * Next.js instrumentation hook — runs once when the server starts.
 *
 * We use this to validate environment variables at boot time rather than
 * at first request, so misconfigurations are caught immediately.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate env vars on server startup. The import itself triggers
    // validation — if any required var is missing, the process will crash
    // with a clear diagnostic message before accepting any requests.
    await import("@/lib/env");
  }
}
