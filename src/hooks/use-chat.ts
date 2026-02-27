"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatAttachment } from "@/types/database";

const HISTORY_PAGE_SIZE = 50;

export interface ChatMessageCitation {
  /** The [Author, Year] key used to look up metadata during rendering */
  citationText: string;
  source?: string;
  title: string;
  authors?: string[];
  year?: number;
  doi?: string;
  evidence_level?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Flat list of all citations (for DB storage / backward compat) */
  citations?: ChatMessageCitation[];
  /** Multi-citation map: citation text → array of up to 3 references */
  citationsByKey?: Record<string, ChatMessageCitation[]>;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
  created_at?: string;
}

interface UseChatOptions {
  conversationId?: string | null;
  patientId?: string | null;
  isDeepConsult?: boolean;
  clinicalLens?: "functional" | "conventional" | "both";
  selectedSources?: string[];
  onConversationCreated?: (id: string) => void;
  onError?: (error: string) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    options.conversationId || null
  );
  const [queriesRemaining, setQueriesRemaining] = useState<number | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>("");
  const nextCursorRef = useRef<string | null>(null);
  const lastFailedContentRef = useRef<string | null>(null);
  const failedConvIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (content: string, attachments?: ChatAttachment[]) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);
      lastFailedContentRef.current = null;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        attachments: attachments?.map(({ extracted_text: _, ...rest }) => rest),
        created_at: new Date().toISOString(),
      };

      // Add placeholder assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Reset streaming content accumulator
      streamingContentRef.current = "";

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            conversation_id: conversationId,
            patient_id: options.patientId,
            is_deep_consult: options.isDeepConsult || false,
            clinical_lens: options.clinicalLens || "functional",
            ...(options.selectedSources?.length ? { source_filter: options.selectedSources } : {}),
            ...(attachments?.length ? { attachments } : {}),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") break;

            try {
              const event = JSON.parse(data);

              switch (event.type) {
                case "conversation_id":
                  setConversationId(event.conversation_id);
                  options.onConversationCreated?.(event.conversation_id);
                  break;

                case "text_delta":
                  // Accumulate content in ref to avoid race conditions
                  streamingContentRef.current += event.text;
                  const currentContent = streamingContentRef.current;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        content: currentContent,
                      };
                    }
                    return updated;
                  });
                  break;

                case "citations_resolved":
                  // Replace message content with DOI-linked citations
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        content: event.content,
                      };
                    }
                    return updated;
                  });
                  break;

                case "citation_metadata":
                  // Legacy single-citation metadata (backward compat)
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        citations: (event.citations as Array<{
                          citationText: string;
                          title?: string;
                          source?: string;
                          authors?: string[];
                          year?: string;
                          doi?: string;
                          evidenceLevel?: string;
                        }>).map((c) => ({
                          citationText: c.citationText,
                          title: c.title || "",
                          source: c.source,
                          authors: c.authors,
                          year: c.year ? parseInt(c.year) : undefined,
                          doi: c.doi,
                          evidence_level: c.evidenceLevel,
                        })),
                      };
                    }
                    return updated;
                  });
                  break;

                case "citation_metadata_multi": {
                  // Multi-citation metadata: up to 3 references per citation key
                  const raw = event.citationsByKey as Record<string, Array<{
                    citationText: string;
                    title?: string;
                    source?: string;
                    authors?: string[];
                    year?: string;
                    doi?: string;
                    evidenceLevel?: string;
                  }>>;

                  const parsed: Record<string, ChatMessageCitation[]> = {};
                  const flatList: ChatMessageCitation[] = [];

                  for (const [key, arr] of Object.entries(raw)) {
                    parsed[key] = arr.map((c) => {
                      const mapped = {
                        citationText: c.citationText,
                        title: c.title || "",
                        source: c.source,
                        authors: c.authors,
                        year: c.year ? parseInt(c.year) : undefined,
                        doi: c.doi,
                        evidence_level: c.evidenceLevel,
                      };
                      flatList.push(mapped);
                      return mapped;
                    });
                  }

                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        citations: flatList,
                        citationsByKey: parsed,
                      };
                    }
                    return updated;
                  });
                  break;
                }

                case "message_complete":
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        id: event.message_id || last.id,
                        isStreaming: false,
                      };
                    }
                    return updated;
                  });
                  if (event.queries_remaining !== undefined) {
                    setQueriesRemaining(event.queries_remaining);
                  }
                  break;

                case "error":
                  throw new Error(event.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled — mark message as complete
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = { ...last, isStreaming: false };
            }
            return updated;
          });
        } else {
          const errorMessage =
            err instanceof Error ? err.message : "Something went wrong";
          setError(errorMessage);
          options.onError?.(errorMessage);
          lastFailedContentRef.current = content.trim();

          // Remove the empty assistant message on error
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant" && !last.content) {
              return updated.slice(0, -1);
            }
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [conversationId, isLoading, options]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const loadConversation = useCallback(
    async (convId: string) => {
      try {
        const response = await fetch(
          `/api/chat/history?conversation_id=${convId}&limit=${HISTORY_PAGE_SIZE}`
        );
        if (!response.ok) throw new Error("Failed to load conversation");
        const data = await response.json();
        setMessages(
          data.messages.map((m: ChatMessage) => ({ ...m, isStreaming: false }))
        );
        setConversationId(convId);
        setIsFavorited(data.is_favorited ?? false);
        setHasMoreMessages(data.hasMore ?? false);
        nextCursorRef.current = data.nextCursor ?? null;
      } catch {
        setError("Failed to load conversation history");
        failedConvIdRef.current = convId;
      }
    },
    []
  );

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !nextCursorRef.current || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({
        conversation_id: conversationId,
        limit: String(HISTORY_PAGE_SIZE),
        cursor: nextCursorRef.current,
      });
      const response = await fetch(`/api/chat/history?${params}`);
      if (!response.ok) throw new Error("Failed to load more messages");

      const data = await response.json();
      const older = (data.messages || []).map((m: ChatMessage) => ({
        ...m,
        isStreaming: false,
      }));

      setMessages((prev) => [...older, ...prev]);
      setHasMoreMessages(data.hasMore ?? false);
      nextCursorRef.current = data.nextCursor ?? null;
    } catch {
      setError("Failed to load earlier messages");
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore]);

  const retry = useCallback(() => {
    const content = lastFailedContentRef.current;
    if (!content) return;
    // Remove the failed user message before resending
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "user" && last.content === content) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    sendMessage(content);
  }, [sendMessage]);

  const retryLoadHistory = useCallback(() => {
    const convId = failedConvIdRef.current;
    if (!convId) return;
    failedConvIdRef.current = null;
    setError(null);
    loadConversation(convId);
  }, [loadConversation]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setIsFavorited(false);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    conversationId,
    queriesRemaining,
    isFavorited,
    setIsFavorited,
    error,
    sendMessage,
    stopStreaming,
    loadConversation,
    loadMoreMessages,
    clearMessages,
    retry,
    retryLoadHistory,
  };
}
