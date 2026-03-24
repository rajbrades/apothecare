"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Static list to filter client-side */
  suggestions?: readonly string[] | string[];
  /** Async function for server-side suggestions */
  fetchSuggestions?: (term: string) => Promise<string[]>;
  debounceMs?: number;
  minChars?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AutocompleteInput({
  value,
  onChange,
  placeholder,
  suggestions: staticSuggestions,
  fetchSuggestions,
  debounceMs = 300,
  minChars = 2,
  className = "",
  style,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter static suggestions client-side
  const filterStatic = useCallback(
    (term: string) => {
      if (!staticSuggestions) return [];
      const lower = term.toLowerCase();
      return staticSuggestions.filter((s) =>
        s.toLowerCase().includes(lower)
      );
    },
    [staticSuggestions]
  );

  // Update suggestions when value changes
  useEffect(() => {
    const term = value.trim();

    if (term.length < minChars) {
      setItems([]);
      setOpen(false);
      return;
    }

    if (staticSuggestions) {
      const filtered = filterStatic(term);
      setItems(filtered);
      setOpen(filtered.length > 0);
      setHighlighted(-1);
      return;
    }

    if (fetchSuggestions) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await fetchSuggestions(term);
          setItems(results);
          setOpen(results.length > 0);
          setHighlighted(-1);
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);

      return () => clearTimeout(debounceRef.current);
    }
  }, [value, minChars, staticSuggestions, fetchSuggestions, debounceMs, filterStatic]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const el = listRef.current.children[highlighted] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  const select = (item: string) => {
    onChange(item);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h < items.length - 1 ? h + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h > 0 ? h - 1 : items.length - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      select(items[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1" style={style}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim().length >= minChars && items.length > 0) {
            setOpen(true);
          }
        }}
        placeholder={placeholder}
        className={
          className ||
          "w-full px-3 py-2.5 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-all"
        }
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-text-muted)]" />
        </div>
      )}

      {open && items.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-30 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg py-1"
        >
          {items.map((item, i) => (
            <li
              key={item}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => {
                e.preventDefault();
                select(item);
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === highlighted
                  ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                  : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
