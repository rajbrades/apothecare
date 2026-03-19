"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, ExternalLink, Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
}

export function FlaggedCitationsClient() {
  const [citations, setCitations] = useState<FlaggedCitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

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

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Flag className="text-amber-500" size={24} />
        <h1 className="text-2xl font-bold text-slate-900">Flagged Citations</h1>
      </div>
      <p className="text-slate-500 text-sm mb-8">
        Citations flagged by practitioners as incorrect, retracted, or suspect. Review and resolve each flag.
      </p>

      {loading && citations.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : citations.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Flag size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No flagged citations to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citations.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-900 text-sm leading-snug">
                    {c.title === "Flagged" ? c.doi : c.title}
                  </h3>
                  {c.authors && c.authors.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {c.authors.slice(0, 3).join(", ")}
                      {c.authors.length > 3 && ` +${c.authors.length - 3} more`}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {c.year && (
                      <span className="text-xs text-slate-400">{c.year}</span>
                    )}
                    {c.journal && (
                      <span className="text-xs text-slate-400">{c.journal}</span>
                    )}
                    {c.evidence_level && (
                      <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {c.evidence_level}
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                      {c.context_type}
                      {c.context_value ? `: ${c.context_value}` : ""}
                    </span>
                  </div>
                </div>

                {/* DOI link */}
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
              <div className="bg-amber-50 border border-amber-100 rounded px-3 py-2 mb-3">
                <p className="text-sm text-amber-900">
                  <span className="font-medium">Reason:</span> {c.flagged_reason}
                </p>
              </div>

              {/* Footer: who flagged + actions */}
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
                    Dismiss Flag
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
                    Remove Citation
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Load more */}
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
