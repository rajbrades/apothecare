"use client";

import Link from "next/link";
import { useState } from "react";
import { Logomark } from "@/components/ui/logomark";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border-light)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logomark size="sm" withText />
        <nav className="hidden sm:flex items-center gap-6">
          <a href="#features" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Features</a>
          <a href="#pricing" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Pricing</a>
          <a href="#about" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">About</a>
        </nav>
        <div className="hidden sm:flex items-center gap-4">
          <Link href="/auth/login" className="text-sm px-4 py-2 rounded-[var(--radius-sm)] border border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] hover:border-[var(--color-border)] transition-colors">Sign in</Link>
          <Link href="/auth/register" className="text-sm px-4 py-2 bg-[var(--color-brand-600)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-500)] transition-colors font-medium">Get Started Free</Link>
        </div>
        <button
          className="sm:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>
      </div>
      {menuOpen && (
        <div className="sm:hidden border-t border-[var(--color-border-light)] bg-[var(--color-surface)] px-6 py-4 flex flex-col gap-4">
          <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Features</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Pricing</a>
          <a href="#about" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">About</a>
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border-light)]">
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-sm px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-center">Sign in</Link>
            <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="text-sm px-4 py-2 bg-[var(--color-brand-600)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-500)] transition-colors font-medium text-center">Get Started Free</Link>
          </div>
        </div>
      )}
    </header>
  );
}
