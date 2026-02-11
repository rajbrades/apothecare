"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square, Paperclip, Microscope } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading || disabled) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const showQueryLimit = queriesRemaining !== null && queriesRemaining !== undefined;
  const isLowQueries = showQueryLimit && queriesRemaining <= 1;

  return (
    <div className="border-t border-[var(--color-border-light)] bg-white px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <div
          className={`relative bg-white rounded-2xl border transition-all ${
            disabled
              ? "border-[var(--color-border-light)] opacity-60"
              : "border-[var(--color-border)] shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-[var(--color-brand-300)]"
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
            className="w-full px-5 pt-4 pb-2 text-[15px] bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] rounded-2xl resize-none"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              {/* Attach button */}
              <button
                type="button"
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-border)] transition-colors disabled:opacity-50"
              >
                <Paperclip size={13} />
                Attach
              </button>

              {/* Deep Consult toggle */}
              <button
                type="button"
                onClick={onToggleDeepConsult}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all disabled:opacity-50 ${
                  isDeepConsult
                    ? "bg-[var(--color-brand-700)] text-white border-[var(--color-brand-700)] shadow-sm"
                    : "text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] hover:border-[var(--color-brand-300)]"
                }`}
              >
                <Microscope size={13} />
                Deep Consult
                <div
                  className={`toggle-switch ${isDeepConsult ? "active" : ""}`}
                  style={{ width: 28, height: 16 }}
                />
              </button>

              {/* Query limit indicator */}
              {showQueryLimit && (
                <span className={`text-[11px] px-2.5 py-1 rounded-full ${
                  isLowQueries
                    ? "bg-[var(--color-accent-50)] text-[var(--color-accent-700)] font-medium"
                    : "text-[var(--color-text-secondary)]"
                }`}>
                  {queriesRemaining} {queriesRemaining === 1 ? "query" : "queries"} left today
                </span>
              )}
            </div>

            {/* Send / Stop button */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <button
                  onClick={onStop}
                  className="w-9 h-9 rounded-full bg-[var(--color-text-secondary)] flex items-center justify-center hover:bg-[var(--color-text-primary)] transition-colors"
                  title="Stop generating"
                >
                  <Square size={14} fill="white" stroke="white" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || disabled}
                  className="w-9 h-9 rounded-full bg-[var(--color-brand-700)] flex items-center justify-center hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                  title="Send message"
                >
                  <Send size={15} stroke="white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-[var(--color-text-tertiary)] text-center mt-2">
          For clinical decision support only. Not a substitute for professional judgment.
        </p>
      </div>
    </div>
  );
}
