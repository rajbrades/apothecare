"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, Paperclip, Microscope, Stethoscope, BookOpen, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResetCountdown } from "@/components/ui/reset-countdown";
import { SourceFilterPopover } from "@/components/chat/source-filter-popover";
import { getSourceLabel, isDefaultSelection, type SourceId } from "@/lib/ai/source-filter";
import type { ChatAttachment } from "@/types/database";

interface ChatInputProps {
  onSend: (message: string, attachments?: ChatAttachment[]) => void;
  onStop?: () => void;
  isLoading: boolean;
  isDeepConsult: boolean;
  onToggleDeepConsult: () => void;
  clinicalLens: "functional" | "conventional" | "both";
  onCycleClinicalLens: () => void;
  selectedSources: SourceId[];
  onChangeSources: (sources: SourceId[]) => void;
  placeholder?: string;
  disabled?: boolean;
  queriesRemaining?: number | null;
  initialAttachments?: ChatAttachment[];
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  isDeepConsult,
  onToggleDeepConsult,
  clinicalLens,
  onCycleClinicalLens,
  selectedSources,
  onChangeSources,
  placeholder = "Ask a clinical question...",
  disabled = false,
  queriesRemaining,
  initialAttachments,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>(initialAttachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [showDeepConsultInfo, setShowDeepConsultInfo] = useState(false);
  const [showSourceFilter, setShowSourceFilter] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialAttachments when they change (e.g. from dashboard handoff)
  useEffect(() => {
    if (initialAttachments?.length) {
      setAttachments(initialAttachments);
    }
  }, [initialAttachments]);

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
    onSend(input.trim(), attachments.length ? attachments : undefined);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, disabled, onSend, attachments]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Check max 5 attachments total
    if (attachments.length + files.length > 5) {
      toast.error("Maximum 5 attachments allowed");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10_485_760) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/chat/attachments", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }

        const attachment: ChatAttachment = await res.json();
        setAttachments((prev) => [...prev, attachment]);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [attachments.length]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

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
              : "border-[var(--color-border)] shadow-[var(--shadow-elevated)] hover:border-[var(--color-brand-400)] focus-within:border-[var(--color-brand-400)] focus-within:shadow-[var(--shadow-focus)]"
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

          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 pb-2">
              {attachments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)] rounded-full"
                >
                  <Paperclip className="w-3 h-3" />
                  {a.name}
                  <span className="text-[var(--color-text-muted)]">
                    ({(a.size / 1_048_576).toFixed(1)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="ml-0.5 text-[var(--color-brand-500)] hover:text-red-600 transition-colors"
                    aria-label={`Remove ${a.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {uploading && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[var(--color-text-muted)]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading...
                </span>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading || attachments.length >= 5}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--color-text-muted)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-secondary)] transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="icon-inline animate-spin" />
                ) : (
                  <Paperclip className="icon-inline" />
                )}
                Attach
              </button>

              {/* Clinical Lens toggle */}
              <button
                type="button"
                onClick={onCycleClinicalLens}
                disabled={disabled}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors disabled:opacity-50 ${
                  clinicalLens !== "functional"
                    ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-300)]"
                    : "text-[var(--color-text-muted)] border-[var(--color-border-light)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-500)] hover:border-[var(--color-brand-200)]"
                }`}
              >
                <Stethoscope className="icon-inline" />
                {clinicalLens === "functional" ? "Functional" : clinicalLens === "conventional" ? "Conventional" : "Both"}
                {clinicalLens !== "functional" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
                )}
              </button>

              {/* Source Filter toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSourceFilter(!showSourceFilter)}
                  disabled={disabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors disabled:opacity-50 ${
                    !isDefaultSelection(selectedSources)
                      ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-300)]"
                      : "text-[var(--color-text-muted)] border-[var(--color-border-light)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-500)] hover:border-[var(--color-brand-200)]"
                  }`}
                >
                  <BookOpen className="icon-inline" />
                  {getSourceLabel(selectedSources)}
                  {!isDefaultSelection(selectedSources) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
                  )}
                </button>

                {showSourceFilter && (
                  <SourceFilterPopover
                    selectedSources={selectedSources}
                    onChangeSources={onChangeSources}
                    onClose={() => setShowSourceFilter(false)}
                  />
                )}
              </div>

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
                className="w-9 h-9 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
