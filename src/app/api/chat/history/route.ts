import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatHistoryQuerySchema } from "@/lib/validations/chat";
import { auditLog } from "@/lib/api/audit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    // Parse and validate query parameters
    const raw = {
      conversation_id: request.nextUrl.searchParams.get("conversation_id") ?? undefined,
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    };

    const parsed = chatHistoryQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid parameters" },
        { status: 400 }
      );
    }

    const { conversation_id, cursor, limit } = parsed.data;

    // Verify conversation ownership
    if (!practitioner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversation_id)
      .eq("practitioner_id", practitioner.id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Build query — fetch limit + 1 to determine if more messages exist
    let query = supabase
      .from("messages")
      .select("id, role, content, citations, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    // Cursor is the created_at of the oldest loaded message; fetch older ones
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to load messages" },
        { status: 500 }
      );
    }

    const allRows = rows || [];
    const hasMore = allRows.length > limit;
    const messages = hasMore ? allRows.slice(0, limit) : allRows;

    // Reverse so messages are in ascending chronological order
    messages.reverse();

    const nextCursor = hasMore ? messages[0]?.created_at ?? null : null;

    if (practitioner) {
      auditLog({
        request,
        practitionerId: practitioner.id,
        action: "read",
        resourceType: "chat_history",
        detail: { conversation_id, count: messages.length },
      });
    }

    return NextResponse.json({ messages, nextCursor, hasMore });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
