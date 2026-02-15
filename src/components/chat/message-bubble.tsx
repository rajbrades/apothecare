"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Copy, Star, Share2, FileDown, ExternalLink } from "lucide-react";
import { LogoAvatar } from "@/components/ui/logomark";
import type { ChatMessage } from "@/hooks/use-chat";

/**
 * Convert plain [Author, Year] citations to Google Scholar markdown links.
 * Skips citations that are already markdown links (followed by `(`).
 */
function processCitations(content: string): string {
  return content.replace(
    /\[([^\]]+?,\s*\d{4}[a-z]?)\](?!\()/g,
    (_match, citation: string) => {
      const searchTerms = citation
        .replace(/et\s+al\.?/g, "")
        .replace(/[,.\s]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
      return `[${citation}](https://scholar.google.com/scholar?q=${encodeURIComponent(searchTerms)})`;
    }
  );
}

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
              <div className="prose-apotheca">
                <ReactMarkdown
                  rehypePlugins={[[rehypeSanitize, {
                    ...defaultSchema,
                    attributes: {
                      ...defaultSchema.attributes,
                      a: [...(defaultSchema.attributes?.a || []), "target", "rel"],
                    },
                  }]]}
                  components={{
                    a: ({ href, children }) => {
                      const isCitation = href?.includes("doi.org/") || href?.includes("scholar.google.com/scholar");
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            isCitation
                              ? "inline-flex items-center gap-0.5 text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] underline decoration-[var(--color-brand-300)] underline-offset-2 hover:decoration-[var(--color-brand-500)] transition-colors text-[13px] font-medium"
                              : "text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] underline underline-offset-2 transition-colors"
                          }
                        >
                          {children}
                          {isCitation && <ExternalLink className="inline w-3 h-3 flex-shrink-0" />}
                        </a>
                      );
                    },
                    p: ({ children }) => (
                      <p className="text-[var(--color-text-primary)] text-[15px] leading-[1.75] mb-3 last:mb-0">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-[var(--color-text-primary)]">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="text-[var(--color-text-secondary)]">
                        {children}
                      </em>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-lg font-semibold text-[var(--color-text-primary)] mt-6 mb-2 font-[var(--font-display)]">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mt-5 mb-2 font-[var(--font-display)]">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mt-4 mb-1.5 font-[var(--font-display)]">
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-1.5 mb-3 ml-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-1.5 mb-3 ml-1 list-decimal list-inside">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-[15px] leading-[1.7] text-[var(--color-text-primary)] flex gap-2">
                        <span className="text-[var(--color-brand-500)] mt-1.5 flex-shrink-0">
                          •
                        </span>
                        <span>{children}</span>
                      </li>
                    ),
                    code: ({ className, children }) => {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code className="px-1.5 py-0.5 bg-[var(--color-surface-tertiary)] text-[var(--color-brand-800)] rounded text-[13px] font-[var(--font-mono)]">
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className="block bg-[var(--color-surface-tertiary)] rounded-[var(--radius-sm)] p-4 text-[13px] font-[var(--font-mono)] text-[var(--color-text-primary)] overflow-x-auto mb-3">
                          {children}
                        </code>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-3 border-[var(--color-brand-300)] pl-4 py-1 my-3 text-[var(--color-text-secondary)] italic">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-3">
                        <table className="min-w-full border border-[var(--color-border-light)] rounded-lg text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 bg-[var(--color-surface-secondary)] text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider border-b border-[var(--color-border-light)]">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-[var(--color-text-primary)] border-b border-[var(--color-border-light)]">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {processCitations(message.content)}
                </ReactMarkdown>
              </div>
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
