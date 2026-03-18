import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { classifyEvidenceLevel } from "@/lib/chat/classify-evidence";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Evidence hierarchy — lower index = stronger evidence */
const EVIDENCE_RANK: Record<string, number> = {
  "meta-analysis": 0,
  "meta_analysis": 0,
  rct: 1,
  guideline: 2,
  clinical_guideline: 2,
  cohort: 3,
  cohort_study: 3,
  "case-study": 4,
  case_study: 4,
  expert_consensus: 5,
  in_vitro: 6,
  other: 7,
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { supplement_name, citation } = body;

    if (!supplement_name || !citation || !citation.doi || !citation.title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // We use the service_role key to bypass RLS for inserting into the global curated table
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const level = citation.level || classifyEvidenceLevel(citation.title);
    const rank = EVIDENCE_RANK[level] ?? 7;

    const { error: insertError } = await serviceClient
      .from("supplement_evidence")
      .upsert(
        {
          supplement_name,
          doi: citation.doi,
          title: citation.title,
          authors: citation.authors || [],
          year: citation.year,
          journal: citation.source,
          evidence_level: level,
          evidence_rank: rank,
          abstract_snippet: citation.summary,
          is_verified: true,
        },
        {
          onConflict: "supplement_name, doi"
        }
      );

    if (insertError) {
      console.error("[Verify Citation] DB Error:", insertError);
      return NextResponse.json({ error: "Failed to save verification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Verify Citation] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
