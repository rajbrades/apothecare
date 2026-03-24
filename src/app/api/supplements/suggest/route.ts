import { NextRequest } from "next/server";

// ── GET /api/supplements/suggest?term=... — NIH Clinical Table Search Service
// Uses the drug_ingredients table which includes vitamins, minerals, herbs,
// and other supplement active ingredients.
// Free, no API key required.
export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term")?.trim();

  if (!term || term.length < 2) {
    return Response.json({ suggestions: [] });
  }

  if (term.length > 100) {
    return Response.json({ error: "Term too long" }, { status: 400 });
  }

  try {
    const url = `https://clinicaltables.nlm.nih.gov/api/drug_ingredients/v3/search?terms=${encodeURIComponent(term)}&maxList=8`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return Response.json({ suggestions: [] });
    }

    // CTSS response format: [totalCount, codes[], extraFields[], displayStrings[]]
    const data = await res.json();
    const displayStrings: string[] = data?.[3] ?? data?.[1] ?? [];

    return Response.json(
      { suggestions: displayStrings.slice(0, 8) },
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
