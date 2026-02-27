"use client";

import { memo, useState, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy, Star, Share2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { LogoAvatar } from "@/components/ui/logomark";
import { markdownRehypePlugins, markdownComponents } from "./markdown-config";
import { ComparisonCard } from "./comparison-card";
import { processCitations } from "@/lib/chat/process-citations";
import { parseComparisonSections } from "@/lib/chat/parse-comparison";
import { CitationMetaContext, type CitationMeta } from "@/lib/chat/citation-meta-context";
import type { ChatMessage } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: ChatMessage;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
      <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
      <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
    </div>
  );
}

function StreamingCursor() {
  return (
    <span className="inline-block w-0.5 h-[22px] bg-[var(--color-brand-500)] animate-pulse ml-0.5 align-text-bottom" />
  );
}

function StreamingRenderer({ content }: { content: string }) {
  return (
    <div className="text-[var(--color-text-primary)] text-[16px] leading-[1.7] whitespace-pre-wrap break-words">
      {content}
      <StreamingCursor />
    </div>
  );
}

function AssistantContent({ message }: { message: ChatMessage }) {
  // Build multi-citation metadata map keyed by [Author, Year] text
  const citationMap = useMemo(() => {
    const map = new Map<string, CitationMeta[]>();

    // Prefer citationsByKey (multi-citation, up to 3 per reference)
    if (message.citationsByKey) {
      for (const [key, arr] of Object.entries(message.citationsByKey)) {
        map.set(
          key,
          arr.map((c) => ({
            citationText: c.citationText,
            title: c.title,
            authors: c.authors,
            year: c.year,
            doi: c.doi,
            source: c.source,
            evidenceLevel: c.evidence_level as CitationMeta["evidenceLevel"],
          }))
        );
      }
    } else {
      // Fallback: legacy single-citation from flat citations array
      for (const c of message.citations ?? []) {
        if (c.citationText) {
          map.set(c.citationText, [{
            citationText: c.citationText,
            title: c.title,
            authors: c.authors,
            year: c.year,
            doi: c.doi,
            source: c.source,
            evidenceLevel: c.evidence_level as CitationMeta["evidenceLevel"],
          }]);
        }
      }
    }
    return map;
  }, [message.citations, message.citationsByKey]);

  const comparison = parseComparisonSections(message.content);

  return (
    <CitationMetaContext.Provider value={citationMap}>
      {comparison ? (
        <ComparisonCard sections={comparison} />
      ) : (
        <div className="prose-apothecare">
          <ReactMarkdown
            rehypePlugins={markdownRehypePlugins}
            components={markdownComponents}
          >
            {processCitations(message.content)}
          </ReactMarkdown>
        </div>
      )}
    </CitationMetaContext.Provider>
  );
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isFavorited = false,
  onToggleFavorite,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;
  const isEmpty = !message.content;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleFavorite = useCallback(() => {
    onToggleFavorite?.();
  }, [onToggleFavorite]);

  const handleShare = useCallback(() => {
    const text = message.content;
    if (navigator.share) {
      navigator.share({ title: "Apothecare Response", text }).catch(() => {
        // User cancelled or share failed — fall back to clipboard
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  }, [message.content]);

  const handleExport = useCallback(() => {
    const timestamp = message.created_at
      ? new Date(message.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    const header = `Apothecare Clinical Response — ${timestamp}\n${"─".repeat(50)}\n\n`;
    const blob = new Blob([header + message.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apothecare-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Response exported");
  }, [message.content, message.created_at]);

  const actionBtnClass =
    "flex items-center gap-1.5 px-3 py-2.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors";

  return (
    <div
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"} group message-entrance`}
    >
      {/* Avatar */}
      {!isUser && (
        <LogoAvatar size={32} className="mt-1" />
      )}

      {/* Message content */}
      <div
        className={`max-w-[720px] ${
          isUser
            ? "bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)] px-5 py-3"
            : "flex-1"
        }`}
      >
        {isUser ? (
          <p className="text-[var(--color-text-primary)] text-[16px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <>
            {isEmpty && isStreaming ? (
              <ThinkingIndicator />
            ) : isStreaming ? (
              <div className="prose-apothecare">
                <StreamingRenderer content={message.content} />
              </div>
            ) : (
              <AssistantContent message={message} />
            )}

            {/* Action bar — only show when not streaming */}
            {!isStreaming && message.content && (
              <div className="flex items-center gap-1 mt-4 opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className={actionBtnClass}
                  title="Copy"
                >
                  {copied ? (
                    <Check className="icon-inline text-emerald-500" />
                  ) : (
                    <Copy className="icon-inline" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleFavorite}
                  className={actionBtnClass}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star
                    className={`icon-inline ${isFavorited ? "fill-amber-400 text-amber-400" : ""}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className={actionBtnClass}
                  title="Share"
                >
                  <Share2 className="icon-inline" />
                </button>
                <button
                  onClick={handleExport}
                  className={actionBtnClass}
                  title="Export as text file"
                >
                  <FileDown className="icon-inline" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            You
          </span>
        </div>
      )}
    </div>
  );
});
