"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { BookOpen, X, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

// ── Context ────────────────────────────────────────────────────────────

interface DeepDiveContextValue {
  openDeepDive: (topic: string) => void;
}

const DeepDiveContext = createContext<DeepDiveContextValue>({
  openDeepDive: () => {},
});

export const useDeepDive = () => useContext(DeepDiveContext);

// ── Provider ───────────────────────────────────────────────────────────

interface DeepDiveProviderProps {
  children: React.ReactNode;
  tier?: string;
}

export function DeepDiveProvider({ children, tier = "pro" }: DeepDiveProviderProps) {
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [triggerPos, setTriggerPos] = useState<{ top: number; left: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTopic, setPanelTopic] = useState("");
  const [mounted, setMounted] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Listen for text selection
  useEffect(() => {
    function handleSelectionChange() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();

        if (!text || text.length < 2 || panelOpen) {
          setSelectedText(null);
          setTriggerPos(null);
          return;
        }

        // Ignore selection inside the deep-dive panel itself
        const anchorNode = sel?.anchorNode;
        if (anchorNode) {
          const el = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
          if (el?.closest("[data-deep-dive-panel]")) return;
        }

        const range = sel?.getRangeAt(0);
        if (!range) return;
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        setSelectedText(text.slice(0, 500));
        setTriggerPos({
          top: rect.top + window.scrollY - 40,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }, 200);
    }

    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("touchend", handleSelectionChange);

    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("touchend", handleSelectionChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [panelOpen]);

  // Hide trigger on scroll
  useEffect(() => {
    function handleScroll() {
      setSelectedText(null);
      setTriggerPos(null);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut: Cmd+Shift+D
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "d") {
        e.preventDefault();
        const sel = window.getSelection()?.toString().trim();
        if (sel && sel.length >= 2) {
          openDeepDive(sel.slice(0, 500));
        }
      }
      if (e.key === "Escape" && panelOpen) {
        setPanelOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen]);

  const openDeepDive = useCallback((topic: string) => {
    setPanelTopic(topic);
    setPanelOpen(true);
    setSelectedText(null);
    setTriggerPos(null);
  }, []);

  const handleTriggerClick = useCallback(() => {
    if (selectedText) {
      openDeepDive(selectedText);
    }
  }, [selectedText, openDeepDive]);

  if (!mounted) return (
    <DeepDiveContext.Provider value={{ openDeepDive }}>
      {children}
    </DeepDiveContext.Provider>
  );

  return (
    <DeepDiveContext.Provider value={{ openDeepDive }}>
      {children}

      {/* Floating trigger button */}
      {selectedText && triggerPos && !panelOpen && createPortal(
        <button
          onClick={handleTriggerClick}
          className="fixed z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-600)] text-white text-xs font-semibold shadow-lg hover:bg-[var(--color-brand-500)] transition-all animate-[fadeScaleIn_150ms_ease-out] print:hidden"
          style={{
            top: Math.max(8, triggerPos.top),
            left: triggerPos.left,
            transform: "translateX(-50%)",
          }}
        >
          <BookOpen className="w-3 h-3" />
          Deep Dive
        </button>,
        document.body
      )}

      {/* Panel */}
      {createPortal(
        <DeepDivePanel
          open={panelOpen}
          topic={panelTopic}
          tier={tier}
          onClose={() => setPanelOpen(false)}
          onFollowUp={(q) => setPanelTopic(q)}
        />,
        document.body
      )}
    </DeepDiveContext.Provider>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────

interface DeepDivePanelProps {
  open: boolean;
  topic: string;
  tier: string;
  onClose: () => void;
  onFollowUp: (topic: string) => void;
}

function DeepDivePanel({ open, topic, tier, onClose, onFollowUp }: DeepDivePanelProps) {
  const [content, setContent] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpInput, setFollowUpInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTopicRef = useRef("");

  const isPro = tier === "pro";

  // Stream content when topic changes
  useEffect(() => {
    if (!open || !topic || topic === prevTopicRef.current) return;
    prevTopicRef.current = topic;

    async function stream() {
      setContent("");
      setError(null);
      setStreaming(true);
      setFollowUpInput("");

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch("/api/deep-dive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Request failed" }));
          setError(data.error || `Error ${res.status}`);
          return;
        }

        if (!res.body) {
          setError("No response body");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setContent(accumulated);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Connection error. Please try again.");
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    }

    stream();

    return () => {
      abortRef.current?.abort();
    };
  }, [open, topic]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      prevTopicRef.current = "";
      setContent("");
      setError(null);
      setStreaming(false);
    }
  }, [open]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (streaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, streaming]);

  function handleFollowUp(text: string) {
    if (!text.trim()) return;
    prevTopicRef.current = ""; // Reset so useEffect triggers
    onFollowUp(text.trim());
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 print:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        data-deep-dive-panel
        className="fixed top-0 right-0 z-50 flex flex-col h-dvh w-[min(420px,100vw)] bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl print:hidden"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-light)] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3 h-3 text-[var(--color-brand-600)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                Clinical Deep-Dive
              </p>
              {topic && (
                <p className="text-[10px] text-[var(--color-text-muted)] leading-tight truncate max-w-[280px]">
                  {topic}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-secondary)] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {!isPro ? (
            <div className="flex flex-col items-center text-center py-12 gap-3">
              <BookOpen className="h-8 w-8 text-[var(--color-text-muted)]" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Pro Feature</p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-[280px]">
                Upgrade to Pro to use Clinical Deep-Dive. Highlight any clinical term to get AI-generated educational content.
              </p>
              <a href="/settings#subscription" className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors">
                Upgrade to Pro
              </a>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center py-12 gap-3">
              <p className="text-sm text-[var(--color-destructive-500)]">{error}</p>
              <button
                onClick={() => { prevTopicRef.current = ""; onFollowUp(topic); }}
                className="text-xs text-[var(--color-brand-600)] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : !content && streaming ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brand-600)]" />
              <span className="text-sm text-[var(--color-text-muted)]">Researching...</span>
            </div>
          ) : content ? (
            <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-[var(--color-text-primary)] [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-[var(--color-border-light)] [&_h2]:pb-1 [&_p]:text-[13px] [&_p]:leading-relaxed [&_li]:text-[13px] [&_li]:leading-relaxed [&_strong]:text-[var(--color-text-primary)]">
              <ReactMarkdown>{content}</ReactMarkdown>
              {streaming && (
                <span className="inline-block w-1.5 h-4 bg-[var(--color-brand-600)] animate-pulse rounded-sm ml-0.5 align-text-bottom" />
              )}
            </div>
          ) : null}
        </div>

        {/* Follow-up input */}
        {isPro && content && !streaming && (
          <div className="flex-shrink-0 border-t border-[var(--color-border-light)] px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFollowUp(followUpInput);
              }}
              className="flex gap-2"
            >
              <input
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                placeholder="Ask a follow-up..."
                maxLength={1000}
                className="flex-1 px-3 py-2 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] transition-all"
              />
              <button
                type="submit"
                disabled={!followUpInput.trim()}
                className="p-2 rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
