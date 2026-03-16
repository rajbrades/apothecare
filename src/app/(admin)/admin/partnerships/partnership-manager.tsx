"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  Play,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Partnership {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number } | null;
}

interface IngestResult {
  file: string;
  title?: string;
  status: string;
  chunkCount?: number;
  message?: string;
  pages?: number;
  step?: string;
  chunksProcessed?: number;
  chunksTotal?: number;
}

export function PartnershipManager({
  partnerships,
}: {
  partnerships: Partnership[];
}) {
  const [selectedSlug, setSelectedSlug] = useState(
    partnerships[0]?.slug || ""
  );
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, { status: "uploading" | "done" | "error"; percent?: number; error?: string }>
  >({});
  const [ingesting, setIngesting] = useState(false);
  const [ingestResults, setIngestResults] = useState<IngestResult[]>([]);
  const [ingestProgress, setIngestProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadFiles = useCallback(async (slug: string) => {
    setLoadingFiles(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/rag/upload?partnershipSlug=${encodeURIComponent(slug)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles(data.files || []);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const handlePartnershipChange = (slug: string) => {
    setSelectedSlug(slug);
    setIngestResults([]);
    setIngestProgress(null);
    loadFiles(slug);
  };

  /**
   * Upload files directly to Supabase Storage via signed URLs.
   * Each file: get signed URL from our API → PUT to Storage.
   * This bypasses the ~4.5 MB Vercel body limit.
   */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setMessage(null);
    setIngestResults([]);
    setUploadProgress({});

    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { status: "error", error: "Not a PDF" },
        }));
        failed++;
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { status: "error", error: "Exceeds 50 MB limit" },
        }));
        failed++;
        continue;
      }

      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: { status: "uploading", percent: 0 },
      }));

      try {
        // Step 1: Get a signed upload URL from our API
        const signedRes = await fetch("/api/admin/rag/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partnershipSlug: selectedSlug,
            fileName: file.name,
          }),
        });
        const signedData = await signedRes.json();
        if (!signedRes.ok) throw new Error(signedData.error);

        // Step 2: Upload directly to Supabase Storage via signed URL
        // Use XMLHttpRequest for upload progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", signedData.signedUrl);
          xhr.setRequestHeader("Content-Type", "application/pdf");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { status: "uploading", percent },
              }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { status: "done", percent: 100 },
        }));
        uploaded++;
      } catch (err: any) {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { status: "error", error: err.message },
        }));
        failed++;
      }
    }

    setMessage({
      type: failed === 0 ? "success" : "error",
      text: `Uploaded ${uploaded} file(s)${failed > 0 ? `, ${failed} failed` : ""}`,
    });

    await loadFiles(selectedSlug);
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Delete "${fileName}" from storage?`)) return;

    try {
      const res = await fetch("/api/admin/rag/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnershipSlug: selectedSlug, fileName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: `Deleted ${fileName}` });
      await loadFiles(selectedSlug);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  /**
   * Run ingestion with NDJSON streaming for real-time progress.
   */
  const handleIngest = async () => {
    if (files.length === 0) {
      setMessage({
        type: "error",
        text: "No files to ingest. Upload PDFs first.",
      });
      return;
    }

    setIngesting(true);
    setMessage(null);
    setIngestResults([]);
    setIngestProgress("Starting ingestion...");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/admin/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnershipSlug: selectedSlug }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ingestion failed");
      }

      // Read NDJSON stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            handleStreamEvent(event);
          } catch {
            // Skip malformed lines
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          handleStreamEvent(event);
        } catch {
          // Skip
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessage({ type: "error", text: err.message });
      }
    } finally {
      setIngesting(false);
      setIngestProgress(null);
      abortRef.current = null;
    }
  };

  function handleStreamEvent(event: any) {
    switch (event.type) {
      case "start":
        setIngestProgress(
          `Processing ${event.totalFiles} file(s) for ${event.partnership}...`
        );
        break;

      case "file_start":
        setIngestProgress(
          `[${event.index + 1}/${event.total}] ${event.file}`
        );
        break;

      case "file_progress": {
        const stepLabels: Record<string, string> = {
          extracting: "Extracting text...",
          chunking: "Chunking document...",
          embedding: event.chunksTotal
            ? `Embedding chunks ${event.chunksProcessed}/${event.chunksTotal}...`
            : "Generating embeddings...",
        };
        setIngestProgress(
          `${event.file}: ${stepLabels[event.step] || event.step}`
        );
        break;
      }

      case "file_done":
        setIngestResults((prev) => [
          ...prev,
          {
            file: event.file,
            title: event.title,
            status: event.status,
            chunkCount: event.chunkCount,
            message: event.message,
            pages: event.pages,
          },
        ]);
        break;

      case "complete":
        setMessage({
          type: "success",
          text: `Processed ${event.filesProcessed} file(s), ${event.totalChunks} total chunks`,
        });
        break;
    }
  }

  // Load files on first render if we have a selected partnership
  const [initialized, setInitialized] = useState(false);
  if (!initialized && selectedSlug) {
    setInitialized(true);
    loadFiles(selectedSlug);
  }

  return (
    <div className="space-y-6">
      {/* Partnership selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Partnership
        </label>
        <select
          value={selectedSlug}
          onChange={(e) => handlePartnershipChange(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {partnerships.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name} {!p.is_active ? "(inactive)" : ""}
            </option>
          ))}
        </select>
      </div>

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

      {/* Actions */}
      <div className="flex gap-3">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading || !selectedSlug}
          />
          <Button
            variant="outline"
            disabled={uploading || !selectedSlug}
            asChild
          >
            <span>
              {uploading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Upload size={16} className="mr-2" />
              )}
              {uploading ? "Uploading..." : "Upload PDFs"}
            </span>
          </Button>
        </label>

        <Button
          onClick={handleIngest}
          disabled={ingesting || files.length === 0 || !selectedSlug}
          variant="default"
        >
          {ingesting ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Play size={16} className="mr-2" />
          )}
          {ingesting ? "Ingesting..." : "Run Ingestion"}
        </Button>
      </div>

      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          {Object.entries(uploadProgress).map(([name, info]) => (
            <div key={name} className="flex items-center gap-3">
              {info.status === "uploading" ? (
                <Loader2 size={14} className="animate-spin text-blue-500" />
              ) : info.status === "done" ? (
                <CheckCircle size={14} className="text-emerald-500" />
              ) : (
                <AlertCircle size={14} className="text-red-500" />
              )}
              <span className="text-sm text-slate-700 flex-1 truncate">
                {name}
              </span>
              {info.status === "uploading" && info.percent != null && (
                <div className="w-32 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${info.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">
                    {info.percent}%
                  </span>
                </div>
              )}
              {info.status === "error" && (
                <span className="text-xs text-red-500">{info.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ingestion live progress */}
      {ingestProgress && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <Loader2 size={16} className="animate-spin" />
          {ingestProgress}
        </div>
      )}

      {/* Files in storage */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Files in Storage
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            PDFs uploaded to the{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
              partnership-docs/{selectedSlug}/
            </code>{" "}
            bucket
          </p>
        </div>

        {loadingFiles ? (
          <div className="px-6 py-8 text-center text-slate-400">
            <Loader2 size={20} className="animate-spin mx-auto mb-2" />
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400">
            <FileText size={24} className="mx-auto mb-2 opacity-50" />
            No PDFs uploaded yet. Use the Upload button above.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {files.map((file) => (
              <li
                key={file.id || file.name}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-800">{file.name}</span>
                  {file.metadata?.size && (
                    <span className="text-xs text-slate-400">
                      {file.metadata.size > 1024 * 1024
                        ? `${(file.metadata.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${(file.metadata.size / 1024).toFixed(0)} KB`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(file.name)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete file"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ingestion results */}
      {ingestResults.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              Ingestion Results
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {ingestResults.map((result, i) => (
              <li key={i} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.status === "ready" ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : result.status === "skipped" ? (
                      <CheckCircle size={16} className="text-slate-400" />
                    ) : (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    <span className="text-sm text-slate-800">
                      {result.file}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        result.status === "ready"
                          ? "bg-emerald-50 text-emerald-700"
                          : result.status === "skipped"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-x-3">
                    {result.chunkCount != null && (
                      <span>{result.chunkCount} chunks</span>
                    )}
                    {result.pages != null && (
                      <span>{result.pages} pages</span>
                    )}
                  </div>
                </div>
                {result.message && (
                  <p className="text-xs text-slate-500 mt-1 ml-7">
                    {result.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
