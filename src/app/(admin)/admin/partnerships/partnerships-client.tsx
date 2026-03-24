"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Library,
  FileText,
  Users,
  Plus,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Partnership {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  documentCount: number;
  practitionerCount: number;
}

interface IngestedDoc {
  id: string;
  title: string;
  source: string;
  document_type: string | null;
  status: string;
  chunk_count: number;
  partnership_id: string;
  ingested_at: string;
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  ready: CheckCircle2,
  processing: Clock,
  error: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  ready: "text-emerald-600",
  processing: "text-amber-500",
  error: "text-red-500",
};

export function PartnershipsClient() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        fetch("/api/admin/partnerships"),
        fetch("/api/admin/rag/ingest"),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPartnerships(pData.partnerships || []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDocuments(dData.documents || []);
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleIngest = async (slug: string) => {
    setIngesting(slug);
    try {
      const res = await fetch("/api/admin/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnershipSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ingestion failed");
        return;
      }
      toast.success(
        `Ingested ${data.totalChunks} chunks from ${data.filesProcessed} files`
      );
      fetchData();
    } catch {
      toast.error("Ingestion failed");
    } finally {
      setIngesting(null);
    }
  };

  const handleCreate = async () => {
    if (!newName || !newSlug) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          description: newDescription || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create partnership");
        return;
      }
      toast.success(`Created partnership: ${newName}`);
      setShowCreateForm(false);
      setNewName("");
      setNewSlug("");
      setNewDescription("");
      fetchData();
    } catch {
      toast.error("Failed to create partnership");
    } finally {
      setCreating(false);
    }
  };

  const getDocsForPartnership = (partnershipId: string) =>
    documents.filter((d) => d.partnership_id === partnershipId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Actions bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} />
          Add Partnership
        </button>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            New Partnership
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug || newSlug === slugify(newName)) {
                    setNewSlug(slugify(e.target.value));
                  }
                }}
                placeholder="Apex Energetics"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="apex-energetics"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Professional-grade nutritional supplements..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !newName || !newSlug}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Partnership cards */}
      {partnerships.map((p) => {
        const docs = getDocsForPartnership(p.id);
        return (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Library className="text-violet-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {p.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    <span className="font-mono">{p.slug}</span>
                    {p.description && ` — ${p.description}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <FileText size={14} />
                  <span>{p.documentCount} docs</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Users size={14} />
                  <span>{p.practitionerCount} practitioners</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    p.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {p.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => handleIngest(p.slug)}
                  disabled={ingesting === p.slug}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-50"
                >
                  {ingesting === p.slug ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Re-ingest
                </button>
              </div>
            </div>

            {/* Documents table */}
            {docs.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-2 text-left font-medium">Document</th>
                    <th className="px-6 py-2 text-left font-medium">Type</th>
                    <th className="px-6 py-2 text-right font-medium">Chunks</th>
                    <th className="px-6 py-2 text-left font-medium">Status</th>
                    <th className="px-6 py-2 text-left font-medium">Ingested</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => {
                    const StatusIcon = STATUS_ICONS[doc.status] || Clock;
                    const statusColor = STATUS_COLORS[doc.status] || "text-slate-400";
                    return (
                      <tr key={doc.id} className="border-t border-slate-100">
                        <td className="px-6 py-3 text-slate-900 font-medium">
                          {doc.title}
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {doc.document_type || "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 font-mono">
                          {doc.chunk_count}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`flex items-center gap-1.5 ${statusColor}`}>
                            <StatusIcon size={14} />
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {doc.ingested_at
                            ? new Date(doc.ingested_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-slate-400">
                No documents ingested yet. Place PDFs in{" "}
                <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  docs/partnerships/{p.slug}/
                </code>{" "}
                and click Re-ingest.
              </div>
            )}
          </div>
        );
      })}

      {partnerships.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          No partnerships created yet.
        </div>
      )}
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
