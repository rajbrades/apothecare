"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Flag,
  ExternalLink,
  Check,
  Trash2,
  Loader2,
  MessageSquare,
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface QAContext {
  question: string;
  answer: string;
}

interface FlaggedCitation {
  id: string;
  doi: string;
  title: string;
  authors?: string[];
  year?: number;
  journal?: string;
  evidence_level?: string;
  flagged_reason: string;
  context_type: string;
  context_value?: string;
  verified_at: string;
  flagged_by_name: string;
  total_flags: number;
  auto_excluded: boolean;
  has_correction: boolean;
  qa_context: QAContext | null;
}

interface SearchResult {
  doi: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  evidence_level: string;
}

export function FlaggedCitationsClient() {
  const [citations, setCitations] = useState<FlaggedCitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchCitations = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/admin/flagged-citations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCitations((prev) => (cursor ? [...prev, ...json.data] : json.data));
      setNextCursor(json.nextCursor);
    } catch {
      toast.error("Failed to load flagged citations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCitations();
  }, [fetchCitations]);

  async function handleResolve(id: string, action: "dismiss" | "remove") {
    setResolving(id);
    try {
      const res = await fetch("/api/admin/flagged-citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error("Failed to resolve");
      setCitations((prev) => prev.filter((c) => c.id !== id));
      toast.success(action === "dismiss" ? "Flag dismissed — citation restored" : "Citation removed");
    } catch {
      toast.error("Failed to resolve citation");
    } finally {
      setResolving(null);
    }
  }

  async function handleReplace(id: string, result: SearchResult) {
    setResolving(id);
    try {
      const res = await fetch("/api/admin/flagged-citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "replace",
          replacement_doi: result.doi,
          replacement_title: result.title,
          replacement_authors: result.authors,
          replacement_year: result.year,
          replacement_journal: result.journal,
          replacement_evidence_level: result.evidence_level,
        }),
      });
      if (!res.ok) throw new Error("Failed to replace");
      setCitations((prev) => prev.filter((c) => c.id !== id));
      setReplacingId(null);
      setSearchResults([]);
      setSearchQuery("");
      toast.success("Citation replaced — future uses of this DOI will auto-substitute");
    } catch {
      toast.error("Failed to replace citation");
    } finally {
      setResolving(null);
    }
  }

  async function handleSearch() {
    if (searchQuery.length < 3) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/flagged-citations/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      setSearchResults(json.results || []);
    } catch {
      toast.error("Citation search failed");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Flag className="text-[var(--color-gold-500)]" size={24} />
        <h1 className="text-2xl font-bold text-slate-900">Flagged Citations</h1>
      </div>
      <p className="text-slate-500 text-sm mb-2">
        Citations flagged by practitioners as incorrect or suspect. DOIs flagged by 3+ practitioners are auto-excluded.
      </p>
      <p className="text-slate-400 text-xs mb-8">
        Review context, dismiss false flags, remove bad citations, or replace with a correct citation so the system learns.
      </p>

      {loading && citations.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : citations.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Flag size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No flagged citations to review.</p>
          <p className="text-xs mt-1">Citations with 3+ flags are auto-excluded from results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {citations.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
            >
              {/* Main card */}
              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900 text-sm leading-snug">
                        {c.title === "Flagged" ? c.doi : c.title}
                      </h3>
                      {c.total_flags > 1 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                          <AlertTriangle size={10} />
                          {c.total_flags} flags
                        </span>
                      )}
                      {c.has_correction && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
                          Has correction
                        </span>
                      )}
                    </div>
                    {c.authors && c.authors.length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {c.authors.slice(0, 3).join(", ")}
                        {c.authors.length > 3 && ` +${c.authors.length - 3} more`}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {c.year && <span className="text-xs text-slate-400">{c.year}</span>}
                      {c.journal && <span className="text-xs text-slate-400">{c.journal}</span>}
                      {c.evidence_level && (
                        <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {c.evidence_level}
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-[var(--color-gold-50)] text-[var(--color-gold-700)]">
                        {c.context_type}
                        {c.context_value ? `: ${c.context_value}` : ""}
                      </span>
                    </div>
                  </div>

                  {c.doi && (
                    <a
                      href={`https://doi.org/${c.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      DOI <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Flag reason */}
                <div className="bg-[var(--color-gold-50)] border border-[var(--color-gold-100)] rounded px-3 py-2 mb-3">
                  <p className="text-sm text-[var(--color-gold-700)]">
                    <span className="font-medium">Reason:</span> {c.flagged_reason}
                  </p>
                </div>

                {/* Q&A Context toggle */}
                {c.qa_context && (
                  <button
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mb-3"
                  >
                    <MessageSquare size={12} />
                    {expandedId === c.id ? "Hide" : "View"} conversation context
                    {expandedId === c.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Flagged by {c.flagged_by_name} on{" "}
                    {new Date(c.verified_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolve(c.id, "dismiss")}
                      disabled={resolving === c.id}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
                    >
                      {resolving === c.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        setReplacingId(replacingId === c.id ? null : c.id);
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                      disabled={resolving === c.id}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                    >
                      <Replace size={12} />
                      Replace
                    </button>
                    <button
                      onClick={() => handleResolve(c.id, "remove")}
                      disabled={resolving === c.id}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                    >
                      {resolving === c.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Q&A Context */}
              {expandedId === c.id && c.qa_context && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                      User Question
                    </p>
                    <p className="text-sm text-slate-700 bg-white rounded px-3 py-2 border border-slate-200">
                      {c.qa_context.question}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                      AI Answer (excerpt)
                    </p>
                    <p className="text-sm text-slate-700 bg-white rounded px-3 py-2 border border-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {c.qa_context.answer}
                    </p>
                  </div>
                </div>
              )}

              {/* Replace citation panel */}
              {replacingId === c.id && (
                <div className="border-t border-slate-100 bg-blue-50/50 px-5 py-4">
                  <p className="text-xs font-semibold text-slate-700 mb-3">
                    Search for a replacement citation
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="e.g. vitamin D supplementation meta-analysis"
                      className="flex-1 text-sm px-3 py-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching || searchQuery.length < 3}
                      className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {searching ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Search size={12} />
                      )}
                      Search
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.doi}
                          className="flex items-start justify-between gap-3 bg-white rounded-md border border-slate-200 px-3 py-2.5 hover:border-blue-300 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 leading-snug">
                              {result.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {result.authors.slice(0, 3).join(", ")}
                              {result.year ? ` (${result.year})` : ""}
                              {result.journal ? ` — ${result.journal}` : ""}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                {result.evidence_level}
                              </span>
                              <a
                                href={`https://doi.org/${result.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-500 hover:underline"
                              >
                                {result.doi}
                              </a>
                            </div>
                          </div>
                          <button
                            onClick={() => handleReplace(c.id, result)}
                            disabled={resolving === c.id}
                            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] transition-colors disabled:opacity-50"
                          >
                            <Check size={12} />
                            Use this
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && !searching && searchQuery.length >= 3 && (
                    <p className="text-xs text-slate-400 text-center py-2">
                      No results. Try a different search query.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {nextCursor && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchCitations(nextCursor)}
                disabled={loading}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
