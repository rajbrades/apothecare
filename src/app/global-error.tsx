"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#f8faf9",
          color: "#1a2e2a",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: "2rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "#0d9479",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "Georgia, serif",
              }}
            >
              A
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontFamily: "'Newsreader', Georgia, serif",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#5a7a72",
              marginBottom: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            An unexpected error occurred. Please try again or return to the home
            page.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                backgroundColor: "#0d9479",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "0.5rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                backgroundColor: "transparent",
                color: "#0d9479",
                border: "1px solid #d1e5e0",
                borderRadius: 8,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
