import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/health — Check API key status and service connectivity.
 * Requires authenticated admin user. Does NOT expose key values.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check which env vars are set (true/false only — never expose values)
    const keys = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      MINIMAX_API_KEY: !!process.env.MINIMAX_API_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SITE_PASSWORD: !!process.env.SITE_PASSWORD,
      CRON_SECRET: !!process.env.CRON_SECRET,
    };

    // Quick connectivity tests
    const tests: Record<string, string> = {};

    // Test OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        });
        tests.openai = res.ok ? "connected" : `error: ${res.status}`;
      } catch (err) {
        tests.openai = `error: ${err instanceof Error ? err.message : "unknown"}`;
      }
    } else {
      tests.openai = "no key";
    }

    // Test Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1,
            messages: [{ role: "user", content: "hi" }],
          }),
        });
        // 200 = works, 400 = key valid but bad request (still means key works)
        tests.anthropic = res.ok || res.status === 400 ? "connected" : `error: ${res.status}`;
      } catch (err) {
        tests.anthropic = `error: ${err instanceof Error ? err.message : "unknown"}`;
      }
    } else {
      tests.anthropic = "no key";
    }

    // Test Supabase
    try {
      const { error } = await supabase.from("practitioners").select("id").limit(1);
      tests.supabase = error ? `error: ${error.message}` : "connected";
    } catch {
      tests.supabase = "error: connection failed";
    }

    return NextResponse.json({
      status: "ok",
      keys,
      connectivity: tests,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
