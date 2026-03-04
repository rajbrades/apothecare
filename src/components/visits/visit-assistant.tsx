"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Loader2, RotateCcw } from "lucide-react";

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

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

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
      {/* Edge tab — fixed to right edge, vertically centered */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 pl-2.5 pr-2 py-3 rounded-l-lg shadow-md transition-all duration-200 print:hidden ${
          open
            ? "opacity-0 pointer-events-none translate-x-full"
            : "opacity-100 translate-x-0"
        } bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] hover:pr-3 hover:shadow-lg`}
        aria-label="Open AI synthesis assistant"
        style={{ writingMode: "vertical-lr" }}
      >
        <Sparkles className="w-3.5 h-3.5 rotate-90" />
        <span className="text-[11px] font-semibold tracking-wide">AI</span>
      </button>

      {/* Drawer — slides in from right edge */}
      <div
        className={`fixed top-0 right-0 z-50 flex flex-col h-screen w-[340px] bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl transition-transform duration-300 ease-in-out print:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-light)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-[var(--color-brand-600)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                Visit Assistant
              </p>
              {patientName && (
                <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
                  {patientName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
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
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="space-y-3 mt-2">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Ask me to synthesize findings, suggest follow-ups, or explain patterns from this visit.
              </p>
              <div className="space-y-1.5">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left px-3 py-2.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] transition-all"
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
                  className={`max-w-[88%] rounded-[var(--radius-md)] px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[var(--color-brand-600)] text-white"
                      : "bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-light)]"
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Thinking...
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-[var(--color-border-light)] flex-shrink-0">
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
              className="flex-1 resize-none px-2.5 py-2 text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-colors disabled:opacity-50 max-h-[96px]"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>

      {/* Backdrop — click to close */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/10 print:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
