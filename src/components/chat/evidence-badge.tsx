"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink, BookOpen, Users, FileCheck, FlaskConical, FileText } from "lucide-react";

export type EvidenceLevel =
  | "meta-analysis"
  | "rct"
  | "guideline"
  | "cohort"
  | "case-study";

export interface Citation {
  /** Short display label (e.g. "META", "RCT") */
  label?: string;
  /** Evidence level for color coding */
  level: EvidenceLevel;
  /** Full citation title */
  title: string;
  /** Author list */
  authors?: string[];
  /** Publication year */
  year?: number;
  /** Journal or source name */
  source?: string;
  /** DOI or URL */
  doi?: string;
  /** Brief summary of the finding */
  summary?: string;
}

const LEVEL_CONFIG: Record<
  EvidenceLevel,
  {
    label: string;
    shortLabel: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    hoverBgClass: string;
    icon: typeof BookOpen;
    description: string;
  }
> = {
  "meta-analysis": {
    label: "Meta-Analysis",
    shortLabel: "META",
    bgClass: "bg-[#fef3c7]",
    textClass: "text-[#92400e]",
    borderClass: "border-[#fde68a]",
    hoverBgClass: "bg-[#fef3c7]",
    icon: BookOpen,
    description: "Systematic review of multiple studies",
  },
  rct: {
    label: "Randomized Controlled Trial",
    shortLabel: "RCT",
    bgClass: "bg-[#dbeafe]",
    textClass: "text-[#1e40af]",
    borderClass: "border-[#bfdbfe]",
    hoverBgClass: "bg-[#dbeafe]",
    icon: FlaskConical,
    description: "Gold standard clinical trial",
  },
  guideline: {
    label: "Clinical Guideline",
    shortLabel: "GUIDELINE",
    bgClass: "bg-[#d1fae5]",
    textClass: "text-[#065f46]",
    borderClass: "border-[#a7f3d0]",
    hoverBgClass: "bg-[#d1fae5]",
    icon: FileCheck,
    description: "Professional society recommendation",
  },
  cohort: {
    label: "Cohort Study",
    shortLabel: "COHORT",
    bgClass: "bg-[#f1f5f9]",
    textClass: "text-[#475569]",
    borderClass: "border-[#e2e8f0]",
    hoverBgClass: "bg-[#f1f5f9]",
    icon: Users,
    description: "Observational population study",
  },
  "case-study": {
    label: "Case Study",
    shortLabel: "CASE",
    bgClass: "bg-[#f3f4f6]",
    textClass: "text-[#374151]",
    borderClass: "border-[#e5e7eb]",
    hoverBgClass: "bg-[#f3f4f6]",
    icon: FileText,
    description: "Individual case report",
  },
};

interface EvidenceBadgeProps {
  citation: Citation;
  /** Optional index number for numbered citations */
  index?: number;
}

export function EvidenceBadge({ citation, index }: EvidenceBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<"above" | "below">("above");
  const badgeRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const config = LEVEL_CONFIG[citation.level];
  const displayLabel = citation.label || config.shortLabel;
  const Icon = config.icon;

  // Calculate popover position based on available viewport space
  useEffect(() => {
    if (isExpanded && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPopoverPosition(spaceAbove > 280 || spaceAbove > spaceBelow ? "above" : "below");
    }
  }, [isExpanded]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isExpanded) return;

    const handleClick = (e: MouseEvent) => {
      if (
        badgeRef.current &&
        !badgeRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsExpanded(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsExpanded(false), 200);
  };

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const formatAuthors = (authors: string[]) => {
    if (authors.length <= 2) return authors.join(" & ");
    return `${authors[0]} et al.`;
  };

  return (
    <span
      ref={badgeRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Inline badge */}
      <button
        type="button"
        onClick={handleClick}
        className={`citation-badge ${config.bgClass} ${config.textClass} border ${config.borderClass} evidence-badge-hover`}
        aria-expanded={isExpanded}
        aria-label={`${config.label} citation: ${citation.title}`}
      >
        {index !== undefined && (
          <span className="font-[var(--font-mono)] text-[10px] mr-1 opacity-60">
            {index}
          </span>
        )}
        <span className="font-semibold text-[11px] tracking-wide uppercase">
          {displayLabel}
        </span>
      </button>

      {/* Expanded popover */}
      {isExpanded && (
        <div
          ref={popoverRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute z-50 w-80 animate-evidence-expand ${
            popoverPosition === "above"
              ? "bottom-full mb-2"
              : "top-full mt-2"
          } left-1/2 -translate-x-1/2`}
        >
          <div className={`bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-elevated)] overflow-hidden`}>
            {/* Evidence level header */}
            <div className={`px-4 py-2.5 ${config.hoverBgClass} border-b ${config.borderClass}`}>
              <div className="flex items-center gap-2">
                <Icon size={14} className={config.textClass} />
                <span className={`text-xs font-semibold ${config.textClass}`}>
                  {config.label}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${config.textClass} opacity-70`}>
                {config.description}
              </p>
            </div>

            {/* Citation details */}
            <div className="px-4 py-3">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug mb-1.5 font-[var(--font-display)]">
                {citation.title}
              </h4>

              {(citation.authors || citation.year || citation.source) && (
                <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-2">
                  {citation.authors && (
                    <span>{formatAuthors(citation.authors)}</span>
                  )}
                  {citation.year && (
                    <span>
                      {citation.authors ? " (" : ""}
                      {citation.year}
                      {citation.authors ? ")" : ""}
                    </span>
                  )}
                  {citation.source && (
                    <span className="italic">
                      {(citation.authors || citation.year) ? ". " : ""}
                      {citation.source}
                    </span>
                  )}
                </p>
              )}

              {citation.summary && (
                <p className="text-[12px] text-[var(--color-text-tertiary)] leading-relaxed mb-2 border-t border-[var(--color-border-light)] pt-2">
                  {citation.summary}
                </p>
              )}

              {citation.doi && (
                <a
                  href={
                    citation.doi.startsWith("http")
                      ? citation.doi
                      : `https://doi.org/${citation.doi}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${config.textClass} hover:underline mt-1`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={11} />
                  View source
                </a>
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[var(--color-surface)] border-[var(--color-border)] rotate-45 ${
              popoverPosition === "above"
                ? "bottom-[-6px] border-r border-b"
                : "top-[-6px] border-l border-t"
            }`}
          />
        </div>
      )}
    </span>
  );
}

/** Convenience wrapper for rendering a list of evidence badges inline */
interface EvidenceBadgeListProps {
  citations: Citation[];
}

export function EvidenceBadgeList({ citations }: EvidenceBadgeListProps) {
  return (
    <span className="inline-flex flex-wrap gap-1 ml-1">
      {citations.map((citation, i) => (
        <EvidenceBadge
          key={`${citation.level}-${citation.title}-${i}`}
          citation={citation}
          index={citations.length > 1 ? i + 1 : undefined}
        />
      ))}
    </span>
  );
}
