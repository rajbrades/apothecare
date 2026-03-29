"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Maximize2, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Slide {
  title: string;
  content: string;
}

interface DeepDiveSlidesProps {
  topic: string;
  content: string;
  onClose: () => void;
}

/**
 * Parse Deep Dive markdown content into slides.
 * Each ## heading becomes a slide.
 */
function parseSlides(topic: string, content: string): Slide[] {
  const slides: Slide[] = [];

  // Title slide
  slides.push({ title: topic, content: "" });

  // Split on ## headings
  const sections = content.split(/^## /m).filter(Boolean);
  for (const section of sections) {
    const lines = section.split("\n");
    const heading = lines[0]?.trim() || "Untitled";
    const body = lines.slice(1).join("\n").trim();
    if (body) {
      slides.push({ title: heading, content: body });
    }
  }

  return slides;
}

export function DeepDiveSlides({ topic, content, onClose }: DeepDiveSlidesProps) {
  const slides = parseSlides(topic, content);
  const [current, setCurrent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev, onClose]);

  if (!mounted) return null;

  const slide = slides[current];
  const isTitle = current === 0;

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-[var(--color-surface)] flex flex-col animate-[fadeIn_200ms_ease-out]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--color-brand-600)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Clinical Deep-Dive</span>
          <span className="text-xs text-[var(--color-text-muted)] ml-2">
            {current + 1} / {slides.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-secondary)] transition-colors"
        >
          <X className="w-4 h-4 text-[var(--color-text-muted)]" />
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto">
          {isTitle ? (
            /* Title slide */
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] text-[var(--color-brand-700)] text-xs font-semibold mb-8">
                <BookOpen className="w-3 h-3" />
                Clinical Deep-Dive
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
                {slide.title}
              </h1>
              <p className="mt-6 text-lg text-[var(--color-text-muted)]">
                Use arrow keys or click to navigate
              </p>
            </div>
          ) : (
            /* Content slide */
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-8 pb-4 border-b border-[var(--color-border-light)]">
                {slide.title}
              </h2>
              <div className="prose prose-lg max-w-none text-[var(--color-text-secondary)] [&_p]:text-base [&_p]:leading-relaxed [&_li]:text-base [&_li]:leading-relaxed [&_strong]:text-[var(--color-text-primary)] [&_ul]:space-y-2 [&_ol]:space-y-2">
                <ReactMarkdown>{slide.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] flex-shrink-0">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current
                  ? "bg-[var(--color-brand-600)] w-4"
                  : "bg-[var(--color-border)] hover:bg-[var(--color-text-muted)]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
