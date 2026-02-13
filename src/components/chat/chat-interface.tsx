"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ArrowRight, Leaf, Loader2 } from "lucide-react";
import Link from "next/link";
import { Logomark } from "@/components/ui/logomark";

export function ChatInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q");
  const convId = searchParams.get("id");

  const [isDeepConsult, setIsDeepConsult] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialQuerySentRef = useRef(false);

  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    conversationId,
    queriesRemaining,
    error,
    sendMessage,
    stopStreaming,
    loadConversation,
    loadMoreMessages,
    clearMessages,
  } = useChat({
    conversationId: convId,
    isDeepConsult,
    onConversationCreated: (id) => {
      window.history.replaceState(null, "", `/chat?id=${id}`);
    },
  });

  // Preserve scroll position when prepending older messages
  const handleLoadMore = useCallback(async () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const previousScrollHeight = container.scrollHeight;
    await loadMoreMessages();

    // After the DOM updates, restore relative scroll position
    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - previousScrollHeight;
    });
  }, [loadMoreMessages]);

  // Load existing conversation
  useEffect(() => {
    if (convId && !messages.length) {
      loadConversation(convId);
    }
  }, [convId, loadConversation, messages.length]);

  // Auto-send initial query from suggested questions
  useEffect(() => {
    if (initialQuery && !initialQuerySentRef.current && !convId) {
      initialQuerySentRef.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, convId, sendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestedQuestions = [
    {
      text: "What are evidence-based interventions for elevated zonulin?",
      category: "GI Health",
    },
    {
      text: "Compare berberine vs. metformin for insulin resistance",
      category: "Metabolic",
    },
    {
      text: "Optimal DUTCH test protocol for a 42F with fatigue",
      category: "Hormones",
    },
    {
      text: "GI-MAP showing elevated H. pylori with low sIgA — treatment?",
      category: "GI Health",
    },
    {
      text: "Selenium and Hashimoto's thyroiditis — dosing and evidence?",
      category: "Thyroid",
    },
    {
      text: "Interpret: TSH 3.8, Free T3 2.4, TPO Ab 85",
      category: "Lab Review",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-40px)]">
      {/* Evidence banner */}
      <div className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-[var(--color-brand-50)] to-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)]">
        <Leaf size={12} className="text-[var(--color-brand-500)]" />
        <p className="text-[12px] text-[var(--color-text-secondary)]">
          Evidence partnerships with{" "}
          <span className="font-medium text-[var(--color-text-primary)]">A4M</span>,{" "}
          <span className="font-medium text-[var(--color-text-primary)]">IFM</span>,{" "}
          <span className="font-medium text-[var(--color-text-primary)]">Cleveland Clinic</span>,{" "}
          and more
        </p>
      </div>

      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 && !initialQuery ? (
          /* Empty state — show suggestions */
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="mb-5">
              <Logomark size="lg" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1 font-[var(--font-display)]">
              What can I help you with?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-10">
              Ask any clinical question — grounded in functional medicine evidence
            </p>

            <div className="w-full max-w-2xl grid grid-cols-2 gap-2.5">
              {suggestedQuestions.map((q) => (
                <button
                  key={q.text}
                  onClick={() => sendMessage(q.text)}
                  disabled={isLoading}
                  className="group/card text-left px-4 py-3.5 text-[13px] text-[var(--color-text-secondary)] bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:shadow-sm transition-all disabled:opacity-50 suggestion-card-hover"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-brand-500)] mb-1 block">
                    {q.category}
                  </span>
                  <span className="flex items-start justify-between gap-2">
                    <span className="leading-snug">{q.text}</span>
                    <ArrowRight
                      className="icon-inline text-[var(--color-text-muted)] group-hover/card:text-[var(--color-brand-500)] mt-0.5 flex-shrink-0 transition-colors"
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages list */
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
            {/* Load earlier messages */}
            {hasMoreMessages && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-brand-600)] bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)] rounded-full border border-[var(--color-brand-200)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load earlier messages"
                  )}
                </button>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-500 text-lg">!</span>
                <div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  {error.includes("query limit") && (
                    <Link
                      href="/pricing"
                      className="text-sm text-[var(--color-brand-700)] font-medium hover:underline mt-1 inline-block"
                    >
                      Upgrade to Pro for unlimited queries
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isLoading={isLoading}
        isDeepConsult={isDeepConsult}
        onToggleDeepConsult={() => setIsDeepConsult(!isDeepConsult)}
        queriesRemaining={queriesRemaining}
      />
    </div>
  );
}
