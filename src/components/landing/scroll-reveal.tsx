"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale" | "none";
  threshold?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Mark as JS-ready so CSS can hide it for animation
    el.classList.add("scroll-reveal--ready");

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      el.classList.add("revealed");
      return;
    }

    // If element is already in view (above fold), reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      el.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  // Round delay to nearest 100 for CSS class matching
  const roundedDelay = Math.round(delay / 100) * 100;

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className || ""}`}
      data-direction={direction}
      data-delay={roundedDelay > 0 ? String(roundedDelay) : undefined}
    >
      {children}
    </div>
  );
}
