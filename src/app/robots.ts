import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/chat",
        "/visits",
        "/labs",
        "/patients",
        "/supplements",
        "/api/",
        "/auth/onboarding",
      ],
    },
    sitemap: "https://apothecare.ai/sitemap.xml",
  };
}
