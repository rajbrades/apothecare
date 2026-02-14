"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { NodeViewProps } from "@tiptap/react";

export function TemplateSectionNode({ node, updateAttributes }: NodeViewProps) {
  const { heading, badge, placeholder, collapsed } = node.attrs;

  const toggleCollapse = () => {
    updateAttributes({ collapsed: !collapsed });
  };

  return (
    <NodeViewWrapper
      className="template-section mb-3"
      data-section-key={node.attrs.sectionKey}
    >
      <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] overflow-hidden">
        {/* Section header */}
        <button
          type="button"
          onClick={toggleCollapse}
          contentEditable={false}
          className="flex items-center justify-between w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)] cursor-pointer select-none hover:bg-[var(--color-surface-tertiary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[var(--color-brand-600)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {badge}
            </span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {heading}
            </span>
          </div>
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
          )}
        </button>

        {/* Section content */}
        <div
          className={`transition-all ${
            collapsed ? "hidden" : "block"
          }`}
        >
          <NodeViewContent
            className="p-4 min-h-[60px] text-sm leading-relaxed text-[var(--color-text-primary)] outline-none [&_p]:mb-1 [&_p:last-child]:mb-0 [&_.is-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-empty:first-child::before]:text-[var(--color-text-muted)] [&_.is-empty:first-child::before]:opacity-60 [&_.is-empty:first-child::before]:pointer-events-none [&_.is-empty:first-child::before]:float-left [&_.is-empty:first-child::before]:h-0"
            data-placeholder={placeholder}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
