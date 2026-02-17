"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { Stethoscope, Leaf, Scale } from "lucide-react";
import { markdownRehypePlugins, markdownComponents } from "./markdown-config";
import { processCitations } from "@/lib/chat/process-citations";
import type { ComparisonSections } from "@/lib/chat/parse-comparison";

interface ComparisonCardProps {
  sections: ComparisonSections;
}

function PanelMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={markdownRehypePlugins}
      components={markdownComponents}
    >
      {processCitations(content)}
    </ReactMarkdown>
  );
}

export const ComparisonCard = memo(function ComparisonCard({
  sections,
}: ComparisonCardProps) {
  return (
    <div className="comparison-card-entrance">
      {/* Preamble */}
      {sections.preamble && (
        <div className="prose-apotheca mb-4">
          <PanelMarkdown content={sections.preamble} />
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Conventional panel */}
        <div className="comparison-panel-entrance rounded-xl border border-[#bfdbfe] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#eff6ff] border-b border-[#bfdbfe]">
            <Stethoscope className="w-4 h-4 text-[#2563eb]" />
            <h3 className="text-sm font-semibold text-[#2563eb] font-[var(--font-display)]">
              Conventional Approach
            </h3>
          </div>
          <div className="prose-apotheca px-4 py-3 max-h-[500px] overflow-y-auto">
            <PanelMarkdown content={sections.conventional} />
          </div>
        </div>

        {/* Functional panel */}
        <div className="comparison-panel-entrance rounded-xl border border-[var(--color-brand-200)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-brand-50)] border-b border-[var(--color-brand-200)]">
            <Leaf className="w-4 h-4 text-[var(--color-brand-600)]" />
            <h3 className="text-sm font-semibold text-[var(--color-brand-600)] font-[var(--font-display)]">
              Functional/Integrative Approach
            </h3>
          </div>
          <div className="prose-apotheca px-4 py-3 max-h-[500px] overflow-y-auto">
            <PanelMarkdown content={sections.functional} />
          </div>
        </div>
      </div>

      {/* Synthesis panel */}
      <div className="comparison-synthesis-entrance rounded-xl border border-[var(--color-gold-200)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-gold-50)] border-b border-[var(--color-gold-200)]">
          <Scale className="w-4 h-4 text-[var(--color-gold-700)]" />
          <h3 className="text-sm font-semibold text-[var(--color-gold-700)] font-[var(--font-display)]">
            Clinical Synthesis
          </h3>
        </div>
        <div className="prose-apotheca px-4 py-3">
          <PanelMarkdown content={sections.synthesis} />
        </div>
      </div>

      {/* Epilogue */}
      {sections.epilogue && (
        <div className="prose-apotheca mt-4">
          <PanelMarkdown content={sections.epilogue} />
        </div>
      )}
    </div>
  );
});
