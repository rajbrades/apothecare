import { NextRequest } from "next/server";

// ── GET /api/rxnorm/suggest?term=... — Proxy to NLM RxNorm API ─────
// No auth required (used in patient intake forms)
// RxNorm API is free, no API key needed
export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term")?.trim();

  if (!term || term.length < 2) {
    return Response.json({ suggestions: [] });
  }

  if (term.length > 100) {
    return Response.json({ error: "Term too long" }, { status: 400 });
  }

  try {
    const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=8`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return Response.json({ suggestions: [] });
    }

    const data = await res.json();
    const candidates =
      data?.approximateGroup?.candidate ?? [];

    // Extract unique drug names, filtering out dose forms and duplicates
    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const c of candidates) {
      const name = (c.name as string)?.trim();
      if (!name) continue;
      const lower = name.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        suggestions.push(name);
      }
      if (suggestions.length >= 8) break;
    }

    return Response.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      }
    );
  } catch {
    return Response.json({ suggestions: [] });
  }
}
