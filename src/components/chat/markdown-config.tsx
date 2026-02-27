"use client";

import { useContext } from "react";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { ExternalLink, Stethoscope } from "lucide-react";
import { Children, isValidElement } from "react";
import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import type { ReactNode } from "react";
import { CitationMetaContext } from "@/lib/chat/citation-meta-context";
import { EvidenceBadge, EvidenceBadgeList } from "@/components/chat/evidence-badge";
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
  const metaArr = citationMap.get(citationText);

  const isCitation =
    href?.includes("doi.org/") ||
    href?.includes("scholar.google.com/scholar");

  if (isCitation && metaArr && metaArr.length > 0) {
    // Multiple citations → render badge list (up to 3)
    const badges = metaArr
      .filter((m) => m.evidenceLevel)
      .map((m) => ({
        level: m.evidenceLevel as EvidenceLevel,
        title: m.title,
        authors: m.authors,
        year: m.year,
        source: m.source,
        doi: m.doi,
      }));

    if (badges.length > 1) {
      return <EvidenceBadgeList citations={badges} />;
    }
    if (badges.length === 1) {
      return <EvidenceBadge citation={badges[0]} />;
    }
  }

  // Plain citation (Scholar fallback, no metadata) or regular link
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        isCitation
          ? "inline-flex items-center gap-0.5 text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] underline decoration-[var(--color-brand-300)] underline-offset-2 hover:decoration-[var(--color-brand-500)] transition-colors text-[13px] font-medium"
          : "text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] underline underline-offset-2 transition-colors"
      }
    >
      {children}
      {isCitation && (
        <ExternalLink className="inline w-3 h-3 flex-shrink-0" />
      )}
    </a>
  );
}

/** Patterns that trigger the clinical callout treatment. */
const CALLOUT_PATTERNS = [
  "clinical consideration",
  "clinical pearl",
  "practice point",
  "key takeaway",
  "clinical note",
  "important note",
];

/**
 * Detect if a paragraph starts with a bold clinical callout label.
 * Returns the matched label text (e.g. "Clinical consideration") or null.
 */
function detectCalloutLabel(children: ReactNode): string | null {
  // Flatten the entire paragraph to plain text and check the start
  const fullText = flattenChildren(children);
  const lower = fullText.toLowerCase();
  for (const pattern of CALLOUT_PATTERNS) {
    if (lower.startsWith(pattern)) {
      // Extract the label portion (up to and including the colon)
      const colonIdx = fullText.indexOf(":");
      return colonIdx !== -1 ? fullText.slice(0, colonIdx) : pattern;
    }
  }
  return null;
}

/**
 * Renders a clinical callout box with left border, tinted background, and icon.
 * The bold label is stripped from children and rendered as an uppercase header.
 */
function ClinicalCallout({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const cleanLabel = label.replace(/:?\s*$/, "");

  // Strip the leading bold element so the label isn't duplicated.
  // The first child is the <strong> (custom or native), rest is body text.
  const childArray = Children.toArray(children);
  const first = childArray[0];
  let rest: ReactNode[];

  if (isValidElement(first)) {
    // Skip the bold label element entirely
    rest = childArray.slice(1);
  } else if (typeof first === "string") {
    // If it's a plain string starting with the label, strip it
    const stripped = first.replace(new RegExp(`^${label}:?\\s*`, "i"), "");
    rest = [stripped, ...childArray.slice(1)];
  } else {
    rest = childArray;
  }

  return (
    <div className="clinical-callout mt-5 mb-4 last:mb-0 rounded-lg bg-[var(--color-brand-50)] border-l-[3px] border-l-[var(--color-brand-400)] px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Stethoscope
          size={14}
          className="text-[var(--color-brand-600)] flex-shrink-0"
        />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">
          {cleanLabel}
        </span>
      </div>
      <p className="text-[var(--color-text-primary)] text-[16px] leading-[1.7] m-0">
        {rest}
      </p>
    </div>
  );
}

export const markdownComponents: Components = {
  a: ({ href, children }) => (
    <CitationLink href={href}>{children}</CitationLink>
  ),
  p: ({ children }) => {
    const calloutLabel = detectCalloutLabel(children);
    if (calloutLabel) {
      return <ClinicalCallout label={calloutLabel}>{children}</ClinicalCallout>;
    }
    return (
      <p className="text-[var(--color-text-primary)] text-[16px] leading-[1.7] mb-4 last:mb-0">
        {children}
      </p>
    );
  },
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--color-text-primary)] text-[16px]">
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
    <ul className="chat-list space-y-3 mb-4 ml-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="chat-list chat-list-ordered space-y-3 mb-4 ml-0.5 list-none">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="chat-list-item text-[16px] leading-[1.7] text-[var(--color-text-primary)] flex gap-3 items-start">
      <span className="chat-bullet mt-[10px] flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0">{children}</span>
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
