import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Content-Security-Policy
// ---------------------------------------------------------------------------
// Build as an array for readability, then join with "; ".
// NOTE: 'unsafe-inline' for style-src is required because Tailwind CSS v4 and
// CSS custom properties inject inline styles.
// In DEVELOPMENT: Next.js requires 'unsafe-eval' and 'unsafe-inline' for HMR.
// In PRODUCTION: Strict CSP with 'self' only.
// ---------------------------------------------------------------------------
const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  // Default: nothing unless explicitly allowed
  "default-src 'self'",

  // Scripts: In dev, allow eval + inline for Next.js HMR. In prod, strict.
  isDev ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self'",

  // Styles: self + inline (Tailwind v4 / CSS custom properties) + Google Fonts CSS
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // Images: self + data URIs (SVG logomark, base64 thumbnails)
  "img-src 'self' data:",

  // Fonts: self + Google Fonts static files
  "font-src 'self' https://fonts.gstatic.com",

  // Connect: self + Supabase (wildcard *.supabase.co covers any project ref)
  "connect-src 'self' https://*.supabase.co",

  // Media: self + blob (for audio recording playback)
  "media-src 'self' blob:",

  // No iframes of this site (HIPAA clickjacking protection)
  "frame-ancestors 'none'",

  // No object/embed/applet
  "object-src 'none'",

  // Restrict base URI to prevent base-tag hijacking
  "base-uri 'self'",

  // Restrict form targets
  "form-action 'self'",
];

const ContentSecurityPolicy = cspDirectives.join("; ");

// ---------------------------------------------------------------------------
// Security headers applied to every response
// ---------------------------------------------------------------------------
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Prevent MIME-sniffing (e.g. treating HTML as executable)
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Equivalent to frame-ancestors 'none' for older browsers
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Control Referer header — send origin only on cross-origin requests
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Opt out of Topics API, etc.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm', 'remark-parse', 'unified', 'vfile', 'bail', 'is-plain-obj', 'trough'],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // For lab PDF uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
