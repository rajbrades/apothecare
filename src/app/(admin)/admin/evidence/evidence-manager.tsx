"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Play,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Stats {
  totalDocuments: number;
  totalChunks: number;
  bySource: Record<string, number>;
  latestIngestion: string | null;
}

interface SeedResult {
  totalIngested: number;
  totalSkipped: number;
  totalErrors: number;
  queries?: Array<{ query: string; ingested: number; skipped: number; errors: string[] }>;
}

interface IngestResult {
  ingested: number;
  skipped: number;
  errors: string[];
}

export function EvidenceManager() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/evidence/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeed = async () => {
    if (
      !confirm(
        "This will run 39 PubMed queries and ingest all results. This can take several minutes. Continue?"
      )
    )
      return;

    setSeeding(true);
    setMessage(null);
    setSeedResult(null);

    try {
      const res = await fetch("/api/admin/evidence/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSeedResult(data);
      setMessage({
        type: "success",
        text: `Seed complete: ${data.totalIngested} ingested, ${data.totalSkipped} skipped, ${data.totalErrors} errors`,
      });
      await loadStats();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSeeding(false);
    }
  };

  const handleCustomIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    setIngesting(true);
    setMessage(null);
    setIngestResult(null);

    try {
      const res = await fetch("/api/admin/evidence/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: customQuery.trim(),
          maxResults,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIngestResult(data);
      setMessage({
        type: "success",
        text: `Query complete: ${data.ingested} ingested, ${data.skipped} skipped`,
      });
      await loadStats();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Documents"
          value={loadingStats ? "..." : (stats?.totalDocuments ?? 0).toLocaleString()}
          icon={<Database size={18} className="text-blue-500" />}
        />
        <StatCard
          label="Chunks"
          value={loadingStats ? "..." : (stats?.totalChunks ?? 0).toLocaleString()}
          icon={<BarChart3 size={18} className="text-emerald-500" />}
        />
        <StatCard
          label="Sources"
          value={
            loadingStats
              ? "..."
              : Object.keys(stats?.bySource ?? {}).length.toString()
          }
          icon={<Search size={18} className="text-purple-500" />}
        />
        <StatCard
          label="Last Ingestion"
          value={
            loadingStats
              ? "..."
              : stats?.latestIngestion
                ? new Date(stats.latestIngestion).toLocaleDateString()
                : "Never"
          }
          icon={<CheckCircle size={18} className="text-orange-500" />}
        />
      </div>

      {/* Source breakdown */}
      {stats && Object.keys(stats.bySource).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-medium text-slate-700 mb-3">
            Documents by Source
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.bySource)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700"
                >
                  {source}
                  <span className="font-semibold">{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      {/* Seed Evidence */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Seed Evidence Database
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Run 39 curated PubMed queries covering functional medicine topics
          (thyroid, gut health, hormones, nutrients, etc.). Already-ingested
          articles are automatically skipped.
        </p>
        <Button onClick={handleSeed} disabled={seeding}>
          {seeding ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Play size={16} className="mr-2" />
          )}
          {seeding ? "Seeding (this takes a few minutes)..." : "Run Full Seed"}
        </Button>
      </div>

      {/* Seed results */}
      {seedResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Seed Results
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-700">
                {seedResult.totalIngested}
              </div>
              <div className="text-xs text-emerald-600">Ingested</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-600">
                {seedResult.totalSkipped}
              </div>
              <div className="text-xs text-slate-500">Skipped</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {seedResult.totalErrors}
              </div>
              <div className="text-xs text-red-500">Errors</div>
            </div>
          </div>
        </div>
      )}

      {/* Custom PubMed Query */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Custom PubMed Query
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Ingest articles from a specific PubMed search query.
        </p>
        <form onSubmit={handleCustomIngest} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              PubMed Query
            </label>
            <Input
              value={customQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCustomQuery(e.target.value)
              }
              placeholder='e.g. "vitamin D deficiency" AND "autoimmune"'
              disabled={ingesting}
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Max Results
            </label>
            <Input
              type="number"
              value={maxResults}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMaxResults(Number(e.target.value))
              }
              min={1}
              max={200}
              disabled={ingesting}
            />
          </div>
          <Button type="submit" disabled={ingesting || !customQuery.trim()}>
            {ingesting ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Search size={16} className="mr-2" />
            )}
            {ingesting ? "Ingesting..." : "Ingest"}
          </Button>
        </form>
      </div>

      {/* Custom ingest results */}
      {ingestResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-medium text-slate-700 mb-3">
            Query Results
          </h2>
          <div className="flex gap-4 mb-3">
            <span className="text-sm text-emerald-700">
              {ingestResult.ingested} ingested
            </span>
            <span className="text-sm text-slate-500">
              {ingestResult.skipped} skipped
            </span>
            {ingestResult.errors.length > 0 && (
              <span className="text-sm text-red-600">
                {ingestResult.errors.length} errors
              </span>
            )}
          </div>
          {ingestResult.errors.length > 0 && (
            <ul className="text-xs text-red-600 space-y-1">
              {ingestResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
