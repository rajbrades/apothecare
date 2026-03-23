import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

// ── Provider detection ──────────────────────────────────────────────────
// Priority: OPENAI_API_KEY > MINIMAX_API_KEY > ANTHROPIC_API_KEY
type Provider = "openai" | "minimax" | "anthropic";

function getProvider(): Provider {
  if (env.OPENAI_API_KEY) return "openai";
  if (env.MINIMAX_API_KEY) return "minimax";
  return "anthropic";
}

// ── Model selection ─────────────────────────────────────────────────────
const MODEL_MAP: Record<Provider, { standard: string; advanced: string }> = {
  openai: { standard: "gpt-4o", advanced: "gpt-4o" },
  minimax: { standard: "MiniMax-M2.5", advanced: "MiniMax-M2.5" },
  anthropic: {
    standard: "claude-sonnet-4-6",
    advanced: "claude-opus-4-6",
  },
};

let _provider: Provider | undefined;
function resolveProvider(): Provider {
  if (!_provider) {
    _provider = getProvider();
    console.log(`[AI Provider] Active: ${_provider} | Model: ${MODEL_MAP[_provider].standard}`);
  }
  return _provider;
}

export function getModels() {
  return MODEL_MAP[resolveProvider()];
}

// Backwards-compatible — lazily resolved so it doesn't crash at build time.
export const MODELS = new Proxy({} as { standard: string; advanced: string }, {
  get(_target, prop: string) {
    return getModels()[prop as keyof typeof MODEL_MAP["anthropic"]];
  },
});

// Anthropic-specific models for features that always use the Anthropic API
// (document vision, lab PDF parsing) regardless of the primary provider.
export const ANTHROPIC_MODELS = {
  standard: "claude-sonnet-4-6",
  vision: "claude-opus-4-6",
};

export type ModelId = string;

// ── Clients ─────────────────────────────────────────────────────────────
function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

function getAnthropicClient(): Anthropic {
  if (env.ANTHROPIC_API_KEY) {
    return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  if (env.MINIMAX_API_KEY) {
    return new Anthropic({
      apiKey: null,
      authToken: env.MINIMAX_API_KEY,
      baseURL: "https://api.minimax.io/anthropic",
    });
  }
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

// ── Shared types ────────────────────────────────────────────────────────
interface CompletionParams {
  model: string;
  maxTokens: number;
  system: string;
  messages: { role: "user" | "assistant"; content: string | any[] }[];
}

interface CompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

interface StreamCallbacks {
  onText: (text: string) => void;
}

interface StreamResult {
  inputTokens: number;
  outputTokens: number;
}

// ── Non-streaming completion ────────────────────────────────────────────
export async function createCompletion(
  params: CompletionParams
): Promise<CompletionResult> {
  if (resolveProvider() === "openai") {
    const client = getOpenAIClient();
    // Convert content arrays (Anthropic format) to OpenAI format
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: params.system },
      ...params.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      })),
    ];

    const response = await client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens,
      messages,
    });

    return {
      text: response.choices[0]?.message?.content || "",
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    };
  }

  // Anthropic / MiniMax path
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    system: params.system,
    messages: params.messages as Anthropic.MessageParam[],
  });

  const textBlock = response.content.find(
    (b: { type: string }) => b.type === "text"
  );
  const text = textBlock && "text" in textBlock ? textBlock.text : "";

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ── Streaming completion ────────────────────────────────────────────────
export async function streamCompletion(
  params: CompletionParams,
  callbacks: StreamCallbacks
): Promise<StreamResult> {
  if (resolveProvider() === "openai") {
    const client = getOpenAIClient();
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: params.system },
      ...params.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      })),
    ];

    const stream = await client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        callbacks.onText(text);
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens || 0;
        outputTokens = chunk.usage.completion_tokens || 0;
      }
    }

    return { inputTokens, outputTokens };
  }

  // Anthropic / MiniMax path
  const client = getAnthropicClient();
  const stream = await client.messages.stream({
    model: params.model,
    max_tokens: params.maxTokens,
    system: params.system,
    messages: params.messages as Anthropic.MessageParam[],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && "text" in event.delta) {
      callbacks.onText(event.delta.text);
    }
  }

  const finalMessage = await stream.finalMessage();
  return {
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
  };
}

// ── Re-export for document/lab features that need Anthropic directly ────
// Document extraction and lab parsing use Anthropic's document vision feature
// which has no OpenAI equivalent. These fall back to Anthropic/MiniMax only.
export { getAnthropicClient };
