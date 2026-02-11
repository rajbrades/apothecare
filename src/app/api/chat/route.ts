import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAnthropicClient, CLINICAL_CHAT_SYSTEM_PROMPT, MODELS } from "@/lib/ai/anthropic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get practitioner profile
    const { data: practitioner, error: practError } = await supabase
      .from("practitioners")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (practError || !practitioner) {
      return NextResponse.json(
        { error: "Practitioner profile not found" },
        { status: 404 }
      );
    }

    // Check query limits
    const { data: allowed } = await supabase.rpc("check_and_increment_query", {
      p_practitioner_id: practitioner.id,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Daily query limit reached",
          limit: practitioner.subscription_tier === "free" ? 2 : "unlimited",
          upgrade_url: "/pricing",
        },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const {
      message,
      conversation_id,
      patient_id,
      is_deep_consult = false,
    } = body;

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          practitioner_id: practitioner.id,
          patient_id: patient_id || null,
          title: message.slice(0, 100),
          is_deep_consult,
          model_used: is_deep_consult ? MODELS.advanced : MODELS.standard,
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }
      convId = newConv.id;
    }

    // Save user message
    await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user" as const,
      content: message,
    });

    // Build conversation history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20); // Last 20 messages for context

    // Build patient context if available
    let patientContext = "";
    if (patient_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patient_id)
        .single();

      if (patient) {
        patientContext = `\n\n## Patient Context\n- Sex: ${patient.sex || "Not specified"}\n- DOB: ${patient.date_of_birth || "Not specified"}\n- Chief Complaints: ${patient.chief_complaints?.join(", ") || "None listed"}\n- Current Medications: ${patient.current_medications || "None listed"}\n- Supplements: ${patient.supplements || "None listed"}\n- Allergies: ${patient.allergies?.join(", ") || "NKDA"}\n- History: ${patient.medical_history || "Not provided"}`;
      }
    }

    // TODO: RAG retrieval would go here
    // For MVP, we use the model's training knowledge + system prompt
    // const ragContext = await retrieveEvidence(message);

    // Call Anthropic API
    const anthropic = getAnthropicClient();
    const model = is_deep_consult ? MODELS.advanced : MODELS.standard;

    const messages = (history || [])
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await anthropic.messages.create({
      model,
      max_tokens: is_deep_consult ? 4096 : 2048,
      system: CLINICAL_CHAT_SYSTEM_PROMPT + patientContext,
      messages,
    });

    // Extract response text
    const assistantContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("");

    // Save assistant message
    const { data: savedMessage } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        role: "assistant" as const,
        content: assistantContent,
        citations: [], // TODO: Extract citations from RAG + response
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      })
      .select()
      .single();

    // Audit log
    await serviceClient.from("audit_logs").insert({
      practitioner_id: practitioner.id,
      action: "query" as const,
      resource_type: "conversation",
      resource_id: convId,
      ip_address: clientIp,
      user_agent: userAgent,
      detail: {
        model,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        is_deep_consult,
        has_patient_context: !!patient_id,
      },
    });

    return NextResponse.json({
      message: savedMessage,
      conversation_id: convId,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      queries_remaining:
        practitioner.subscription_tier === "free"
          ? Math.max(0, 2 - (practitioner.daily_query_count + 1))
          : null,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
