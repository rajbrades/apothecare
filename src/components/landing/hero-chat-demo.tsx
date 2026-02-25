"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoAvatar } from "@/components/ui/logomark";

const USER_QUESTION =
  "What are evidence-based interventions for elevated zonulin with concurrent low secretory IgA?";

interface TextSegment {
  type: "text" | "badge";
  content: string;
  badgeClass?: string;
}

const AI_SEGMENTS: TextSegment[] = [
  {
    type: "text",
    content:
      "Elevated zonulin with concurrent low sIgA suggests compromised intestinal barrier integrity alongside mucosal immune insufficiency. This pattern warrants a targeted repair protocol.\n\n",
  },
  {
    type: "text",
    content: "**Key interventions based on current evidence:**\n\n",
  },
  {
    type: "text",
    content:
      "**1. L-Glutamine** (5\u201310g/day) \u2014 Primary fuel for enterocytes; reduces intestinal permeability ",
  },
  { type: "badge", content: "META", badgeClass: "evidence-meta" },
  {
    type: "text",
    content:
      "\n\n**2. Zinc Carnosine** (75mg BID) \u2014 Stabilizes gut mucosa and upregulates tight junction proteins ",
  },
  { type: "badge", content: "RCT", badgeClass: "evidence-rct" },
  {
    type: "text",
    content:
      "\n\n**3. Saccharomyces boulardii** (5B CFU BID) \u2014 Enhances sIgA production and modulates mucosal immunity ",
  },
  { type: "badge", content: "RCT", badgeClass: "evidence-rct" },
  {
    type: "text",
    content:
      "\n\n**4. Colostrum** (10\u201320g/day) \u2014 Rich in immunoglobulins; directly supports sIgA repletion ",
  },
  { type: "badge", content: "GUIDELINE", badgeClass: "evidence-guideline" },
  {
    type: "text",
    content:
      "\n\n**5. Omega-3 Fatty Acids** (2\u20134g EPA/DHA) \u2014 Reduces zonulin expression via NF-\u03BAB pathway modulation ",
  },
  { type: "badge", content: "META", badgeClass: "evidence-meta" },
];

function buildTypewriterData() {
  let fullText = "";
  const badgeInsertions: { position: number; content: string; badgeClass: string }[] = [];

  for (const seg of AI_SEGMENTS) {
    if (seg.type === "text") {
      fullText += seg.content;
    } else {
      badgeInsertions.push({
        position: fullText.length,
        content: seg.content,
        badgeClass: seg.badgeClass!,
      });
    }
  }

  return { fullText, badgeInsertions };
}

const { fullText: AI_FULL_TEXT, badgeInsertions: BADGE_INSERTIONS } = buildTypewriterData();

export function HeroChatDemo() {
  const [phase, setPhase] = useState<"idle" | "thinking" | "typing" | "done">("idle");
  const [charIndex, setCharIndex] = useState(0);

  // Auto-start on mount (no IntersectionObserver — hero is always in viewport)
  useEffect(() => {
    const timer = setTimeout(() => setPhase("thinking"), 800);
    return () => clearTimeout(timer);
  }, []);

  // Thinking -> typing transition
  useEffect(() => {
    if (phase !== "thinking") return;
    const timer = setTimeout(() => setPhase("typing"), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  // Typewriter effect
  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex >= AI_FULL_TEXT.length) {
      setPhase("done");
      return;
    }
    const delay = AI_FULL_TEXT[charIndex] === "\n" ? 30 : 8;
    const timer = setTimeout(() => setCharIndex((i) => i + 3), delay);
    return () => clearTimeout(timer);
  }, [phase, charIndex]);

  const renderedContent = () => {
    const currentText = AI_FULL_TEXT.slice(0, charIndex);
    const parts: (string | { badge: string; cls: string })[] = [];
    let lastIndex = 0;

    for (const badge of BADGE_INSERTIONS) {
      if (badge.position <= charIndex) {
        parts.push(currentText.slice(lastIndex, badge.position));
        parts.push({ badge: badge.content, cls: badge.badgeClass });
        lastIndex = badge.position;
      }
    }
    parts.push(currentText.slice(lastIndex));

    return parts.map((part, i) => {
      if (typeof part === "string") {
        const boldParts = part.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i}>
            {boldParts.map((bp, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="font-semibold text-[var(--color-text-primary)]">
                  {bp}
                </strong>
              ) : (
                <span key={j}>{bp}</span>
              )
            )}
          </span>
        );
      }
      return (
        <span
          key={i}
          className={`citation-badge ${part.cls}`}
          style={{ animation: "fade-up 0.3s ease forwards" }}
        >
          {part.badge}
        </span>
      );
    });
  };

  return (
    <Link href="/auth/register" className="block group">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-elevated)] overflow-hidden bg-[var(--color-surface)] group-hover:shadow-[var(--shadow-modal)] transition-shadow">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-light)] bg-[#F5F5F5]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[var(--color-border)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-border)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-border)]" />
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <LogoAvatar size={20} />
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              Apothecare Clinical Chat
            </span>
          </div>
          <div className="w-[54px]" />
        </div>

        {/* Chat content */}
        <div className="p-4 sm:p-5 space-y-5 min-h-[380px]">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-md bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] text-sm text-[var(--color-text-primary)] leading-relaxed">
              {USER_QUESTION}
            </div>
          </div>

          {/* AI response */}
          {phase !== "idle" && (
            <div className="flex gap-3">
              <LogoAvatar size={28} className="mt-0.5" />
              <div className="flex-1 text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {phase === "thinking" && (
                  <div className="flex items-center gap-1 py-2">
                    <div className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--color-brand-400)]" />
                    <div className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--color-brand-400)]" />
                    <div className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--color-brand-400)]" />
                  </div>
                )}
                {(phase === "typing" || phase === "done") && (
                  <>
                    {renderedContent()}
                    {phase === "typing" && (
                      <span className="inline-block w-0.5 h-4 bg-[var(--color-brand-500)] ml-0.5 animate-pulse align-middle" />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
