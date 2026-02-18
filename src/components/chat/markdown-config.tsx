"use client";

import { useContext } from "react";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { ExternalLink } from "lucide-react";
import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import type { ReactNode } from "react";
import { CitationMetaContext } from "@/lib/chat/citation-meta-context";
import { EvidenceBadge } from "@/components/chat/evidence-badge";
import type { EvidenceLevel } from "@/components/chat/evidence-badge";

export const markdownRehypePlugins: PluggableList = [
  [
    rehypeSanitize,
    {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        a: [...(defaultSchema.attributes?.a || []), "target", "rel"],
      },
    },
  ],
];

/** Flatten React children to a plain string for citation map lookup. */
function flattenChildren(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(flattenChildren).join("");
  if (children != null && typeof children === "object" && "props" in children) {
    return flattenChildren((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function CitationLink({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  const citationMap = useContext(CitationMetaContext);
  const citationText = flattenChildren(children);
  const meta = citationMap.get(citationText);

  const isCitation =
    href?.includes("doi.org/") ||
    href?.includes("scholar.google.com/scholar");

  if (isCitation && meta?.evidenceLevel) {
    return (
      <span className="inline-flex items-baseline gap-1">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] underline decoration-[var(--color-brand-300)] underline-offset-2 hover:decoration-[var(--color-brand-500)] transition-colors text-[13px] font-medium"
        >
          {children}
          <ExternalLink className="inline w-3 h-3 flex-shrink-0" />
        </a>
        <EvidenceBadge
          citation={{
            level: meta.evidenceLevel as EvidenceLevel,
            title: meta.title,
            authors: meta.authors,
            year: meta.year,
            source: meta.source,
            doi: meta.doi,
          }}
        />
      </span>
    );
  }

  // Plain citation (Scholar fallback, no metadata) or regular link
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
      {isCitation && (
        <ExternalLink className="inline w-3 h-3 flex-shrink-0" />
      )}
    </a>
  );
}

export const markdownComponents: Components = {
  a: ({ href, children }) => (
    <CitationLink href={href}>{children}</CitationLink>
  ),
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
    <em className="text-[var(--color-text-secondary)]">{children}</em>
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
};
