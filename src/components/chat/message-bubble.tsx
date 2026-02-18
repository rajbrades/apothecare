"use client";

import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Star, Share2, FileDown } from "lucide-react";
import { LogoAvatar } from "@/components/ui/logomark";
import { markdownRehypePlugins, markdownComponents } from "./markdown-config";
import { ComparisonCard } from "./comparison-card";
import { processCitations } from "@/lib/chat/process-citations";
import { parseComparisonSections } from "@/lib/chat/parse-comparison";
import { CitationMetaContext, type CitationMeta } from "@/lib/chat/citation-meta-context";
import type { ChatMessage } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: ChatMessage;
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
    <span className="inline-block w-0.5 h-5 bg-[var(--color-brand-500)] animate-pulse ml-0.5 align-text-bottom" />
  );
}

function StreamingRenderer({ content }: { content: string }) {
  return (
    <div className="text-[var(--color-text-primary)] text-[15px] leading-[1.75] whitespace-pre-wrap break-words">
      {content}
      <StreamingCursor />
    </div>
  );
}

function AssistantContent({ message }: { message: ChatMessage }) {
  // Build citation metadata map keyed by [Author, Year] text
  const citationMap = useMemo(() => {
    const map = new Map<string, CitationMeta>();
    for (const c of message.citations ?? []) {
      if (c.citationText) {
        map.set(c.citationText, {
          citationText: c.citationText,
          title: c.title,
          authors: c.authors,
          year: c.year,
          doi: c.doi,
          source: c.source,
          evidenceLevel: c.evidence_level as CitationMeta["evidenceLevel"],
        });
      }
    }
    return map;
  }, [message.citations]);

  const comparison = parseComparisonSections(message.content);

  return (
    <CitationMetaContext.Provider value={citationMap}>
      {comparison ? (
        <ComparisonCard sections={comparison} />
      ) : (
        <div className="prose-apotheca">
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
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;
  const isEmpty = !message.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

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
          <p className="text-[var(--color-text-primary)] text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <>
            {isEmpty && isStreaming ? (
              <ThinkingIndicator />
            ) : isStreaming ? (
              <div className="prose-apotheca">
                <StreamingRenderer content={message.content} />
              </div>
            ) : (
              <AssistantContent message={message} />
            )}

            {/* Action bar — only show when not streaming */}
            {!isStreaming && message.content && (
              <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  title="Copy"
                >
                  <Copy className="icon-inline" />
                  Copy
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  title="Add to Favorites"
                >
                  <Star className="icon-inline" />
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  title="Share"
                >
                  <Share2 className="icon-inline" />
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  title="Export PDF"
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
