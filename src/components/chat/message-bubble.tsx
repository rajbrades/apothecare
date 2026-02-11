"use client";

import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Star, Share2, FileDown, Check, Leaf } from "lucide-react";
import type { ChatMessage } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-3">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
        <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
        <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
      </div>
      <span className="text-xs text-[var(--color-text-muted)]">Analyzing...</span>
    </div>
  );
}

function StreamingCursor() {
  return (
    <span className="inline-block w-0.5 h-5 bg-[var(--color-brand-500)] animate-pulse ml-0.5 align-text-bottom" />
  );
}

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export const MessageBubble = memo(function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;
  const isEmpty = !message.content;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-brand-700)] to-[var(--color-brand-800)] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <Leaf size={14} className="text-white" strokeWidth={2} />
        </div>
      )}

      {/* Message content */}
      <div
        className={`max-w-[720px] ${
          isUser
            ? "bg-[var(--color-surface-tertiary)] rounded-2xl rounded-tr-sm px-5 py-3"
            : "flex-1"
        }`}
      >
        {isUser ? (
          <>
            <p className="text-[var(--color-text-primary)] text-[15px] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <span className="message-timestamp block text-right mt-1.5">
              {formatTime(message.createdAt || new Date())}
            </span>
          </>
        ) : (
          <>
            {isEmpty && isStreaming ? (
              <ThinkingIndicator />
            ) : (
              <div className="prose-apotheca">
                <ReactMarkdown
                  components={{
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
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mt-4 mb-1.5">
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
                        <code className="block bg-[var(--color-surface-tertiary)] rounded-lg p-4 text-[13px] font-[var(--font-mono)] text-[var(--color-text-primary)] overflow-x-auto mb-3">
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
                  {message.content}
                </ReactMarkdown>
                {isStreaming && <StreamingCursor />}
              </div>
            )}

            {/* Action bar — visible on hover */}
            {!isStreaming && message.content && (
              <div className="flex items-center gap-0.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  title="Copy"
                >
                  {copied ? <Check size={13} className="text-[var(--color-brand-500)]" /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-600)] hover:bg-[var(--color-accent-50)] transition-colors"
                  title="Add to Favorites"
                >
                  <Star size={13} />
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  title="Share"
                >
                  <Share2 size={13} />
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  title="Export PDF"
                >
                  <FileDown size={13} />
                </button>
                <span className="message-timestamp ml-2">
                  {formatTime(message.createdAt || new Date())}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
