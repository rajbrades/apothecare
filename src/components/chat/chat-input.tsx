"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, Paperclip, Microscope, X } from "lucide-react";
import { ResetCountdown } from "@/components/ui/reset-countdown";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  isDeepConsult: boolean;
  onToggleDeepConsult: () => void;
  placeholder?: string;
  disabled?: boolean;
  queriesRemaining?: number | null;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  isDeepConsult,
  onToggleDeepConsult,
  placeholder = "Ask a clinical question...",
  disabled = false,
  queriesRemaining,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showDeepConsultInfo, setShowDeepConsultInfo] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading || disabled) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl+Enter to send
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    // Enter to send (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Escape to stop
    if (e.key === "Escape" && isLoading && onStop) {
      onStop();
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Cmd+K to focus input (new conversation feel)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      // Escape to stop generating
      if (e.key === "Escape" && isLoading && onStop) {
        onStop();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [isLoading, onStop]);

  return (
    <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <div
          className={`relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] border-2 transition-all chat-input-glow ${
            disabled
              ? "border-[var(--color-border-light)] opacity-60"
              : "border-[var(--color-border)] shadow-[var(--shadow-elevated)] hover:border-[var(--color-brand-400)] focus-within:border-[var(--color-brand-400)] focus-within:shadow-[0_4px_20px_-4px_rgba(13,148,121,0.15)]"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="w-full px-5 pt-4 pb-2 text-[15px] bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] rounded-[var(--radius-lg)] resize-none"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--color-text-muted)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)] transition-colors disabled:opacity-50"
              >
                <Paperclip className="icon-inline" />
                Attach
              </button>

              {/* Deep Consult toggle with info */}
              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleDeepConsult}
                  disabled={disabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors disabled:opacity-50 ${
                    isDeepConsult
                      ? "bg-[var(--color-gold-50)] text-[var(--color-gold-700)] border-[var(--color-gold-300)]"
                      : "text-[var(--color-text-muted)] border-[var(--color-border-light)] hover:bg-[var(--color-gold-50)] hover:text-[var(--color-gold-700)] hover:border-[var(--color-gold-200)]"
                  }`}
                >
                  <Microscope className="icon-inline" />
                  Deep Consult
                  {isDeepConsult && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-500)]" />
                  )}
                </button>

                {/* Info trigger */}
                <button
                  type="button"
                  onClick={() => setShowDeepConsultInfo(!showDeepConsultInfo)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center text-[9px] font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
                >
                  ?
                </button>

                {/* Deep Consult info popover */}
                {showDeepConsultInfo && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 p-4 bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-modal)] z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Deep Consult Mode
                      </h4>
                      <button
                        onClick={() => setShowDeepConsultInfo(false)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        <X className="icon-inline" />
                      </button>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-2">
                      Uses our most advanced model (Claude Opus) for complex clinical reasoning. Best for multi-system cases, differential diagnoses, and cross-lab correlations.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-400)]" />
                        Extended thinking
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-400)]" />
                        4096 token responses
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border-light)]">
                      Pro plan only · Counts as 1 query
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Send / Stop button */}
            {isLoading ? (
              <button
                onClick={onStop}
                className="w-9 h-9 rounded-full bg-[var(--color-text-secondary)] flex items-center justify-center hover:bg-[var(--color-text-primary)] transition-colors"
                title="Stop generating (Esc)"
              >
                <Square className="icon-inline" fill="white" stroke="white" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className="w-9 h-9 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send message (Enter)"
              >
                <Send className="icon-inline" stroke="white" />
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[11px] text-[var(--color-text-muted)]">
            For clinical decision support only. Not a substitute for professional judgment.
          </p>
          <div className="flex items-center gap-3">
            {queriesRemaining !== null && queriesRemaining !== undefined && (
              <p className="text-[11px] text-[var(--color-text-muted)]">
                <span className="font-[var(--font-mono)]">{queriesRemaining}</span> queries remaining
                {queriesRemaining === 0 && (
                  <span className="ml-1.5 text-[var(--color-text-muted)]">
                    · <ResetCountdown />
                  </span>
                )}
              </p>
            )}
            <p className="text-[11px] text-[var(--color-text-muted)] hidden sm:block">
              ⌘K focus · ⌘↵ send · Esc stop
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
