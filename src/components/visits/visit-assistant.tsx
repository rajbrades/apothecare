"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Loader2, ChevronDown, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Synthesize the key findings from this visit",
  "What patterns do you see in the IFM Matrix?",
  "Suggest follow-up labs based on findings",
  "Summarize the treatment rationale",
];

interface VisitAssistantProps {
  visitId: string;
  patientName: string | null;
}

export function VisitAssistant({ visitId, patientName }: VisitAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      inputRef.current?.focus();
    }
    if (open) scrollToBottom();
  }, [open, messages.length, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    // Placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch(`/api/visits/${visitId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: `Error: ${err.error || "Something went wrong"}` },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: current },
        ]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "Connection error. Please try again." },
        ]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming, visitId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleAbort = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
    setInput("");
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-200 ${
          open ? "opacity-0 pointer-events-none" : "opacity-100"
        } bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] hover:shadow-xl`}
        aria-label="Open AI synthesis assistant"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Ask AI</span>
      </button>

      {/* Right-side drawer */}
      {open && (
        <>
          {/* Backdrop (mobile only) */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Drawer panel */}
          <div className="fixed top-0 right-0 z-50 flex flex-col h-screen w-full max-w-sm bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-600)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Visit Assistant
                  </p>
                  {patientName && (
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {patientName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded transition-colors"
                    title="Clear conversation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded transition-colors"
                  title="Close"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded transition-colors"
                  title="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-xs text-[var(--color-text-muted)] text-center leading-relaxed">
                    Ask me to synthesize findings, suggest follow-ups, or explain patterns from this visit.
                  </p>
                  <div className="space-y-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="w-full text-left px-3 py-2.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[var(--radius-md)] px-3 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[var(--color-brand-600)] text-white"
                          : "bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-light)]"
                      }`}
                    >
                      {msg.content || (
                        <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Thinking...</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[var(--color-border-light)]">
              {streaming && (
                <button
                  onClick={handleAbort}
                  className="w-full mb-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] hover:bg-red-100 transition-colors"
                >
                  Stop generating
                </button>
              )}
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this visit..."
                  rows={1}
                  disabled={streaming}
                  className="flex-1 resize-none px-3 py-2 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-colors disabled:opacity-50 min-h-[38px] max-h-[120px]"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <p className="mt-1.5 text-[10px] text-[var(--color-text-muted)] text-center">
                Context-aware synthesis from visit data
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
