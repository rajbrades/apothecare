import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay: capture 1% of sessions, 100% of error sessions
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Don't send PII (HIPAA)
  sendDefaultPii: false,

  // Scrub sensitive data from breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Strip query params that might contain patient info
    if (breadcrumb.category === "navigation" && breadcrumb.data?.to) {
      try {
        const url = new URL(breadcrumb.data.to, "http://localhost");
        url.searchParams.delete("q");
        url.searchParams.delete("query");
        breadcrumb.data.to = url.pathname + url.search;
      } catch {
        // ignore malformed URLs
      }
    }
    return breadcrumb;
  },
});
