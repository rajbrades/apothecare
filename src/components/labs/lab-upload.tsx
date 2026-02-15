"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface LabUploadProps {
  patients: PatientOption[];
  onUploaded: () => void;
}

const LAB_VENDORS = [
  { value: "", label: "Auto-detect from PDF" },
  { value: "quest", label: "Quest Diagnostics" },
  { value: "labcorp", label: "LabCorp" },
  { value: "diagnostic_solutions", label: "Diagnostic Solutions (GI-MAP)" },
  { value: "genova", label: "Genova Diagnostics" },
  { value: "precision_analytical", label: "Precision Analytical (DUTCH)" },
  { value: "mosaic", label: "Mosaic Diagnostics" },
  { value: "vibrant", label: "Vibrant Wellness" },
  { value: "spectracell", label: "SpectraCell" },
  { value: "realtime_labs", label: "RealTime Labs" },
  { value: "zrt", label: "ZRT Laboratory" },
  { value: "other", label: "Other" },
];

const TEST_TYPES = [
  { value: "", label: "Auto-detect from PDF" },
  { value: "blood_panel", label: "Blood Panel" },
  { value: "stool_analysis", label: "Stool Analysis" },
  { value: "saliva_hormone", label: "Saliva Hormone" },
  { value: "urine_hormone", label: "Urine Hormone" },
  { value: "organic_acids", label: "Organic Acids" },
  { value: "micronutrient", label: "Micronutrient" },
  { value: "genetic", label: "Genetic" },
  { value: "food_sensitivity", label: "Food Sensitivity" },
  { value: "mycotoxin", label: "Mycotoxin" },
  { value: "environmental", label: "Environmental" },
  { value: "other", label: "Other" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function LabUpload({ patients, onUploaded }: LabUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [labVendor, setLabVendor] = useState("");
  const [testType, setTestType] = useState("");
  const [testName, setTestName] = useState("");
  const [collectionDate, setCollectionDate] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (patientId) formData.append("patient_id", patientId);
      if (labVendor) formData.append("lab_vendor", labVendor);
      if (testType) formData.append("test_type", testType);
      if (testName.trim()) formData.append("test_name", testName.trim());
      if (collectionDate) formData.append("collection_date", collectionDate);

      const res = await fetch("/api/labs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      // Reset form
      setPatientId("");
      setLabVendor("");
      setTestType("");
      setTestName("");
      setCollectionDate("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      onUploaded();
      toast.success("Lab report uploaded — parsing starting");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-[var(--color-brand-600)]" />
          Upload Lab Report
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border-light)]">
          {/* Metadata fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Patient (optional)
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              >
                <option value="">No patient selected</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Lab Vendor
              </label>
              <select
                value={labVendor}
                onChange={(e) => setLabVendor(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              >
                {LAB_VENDORS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Test Type
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              >
                {TEST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Collection Date (optional)
              </label>
              <input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Test Name (optional)
            </label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Comprehensive Metabolic Panel"
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[var(--radius-md)] cursor-pointer transition-colors ${
              dragActive
                ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)]"
                : "border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-surface-secondary)]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="hidden"
            />

            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-[var(--color-brand-600)] animate-spin mb-2" />
                <p className="text-sm text-[var(--color-text-secondary)]">Uploading &amp; parsing...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center mb-3">
                  {dragActive ? (
                    <FileText className="w-6 h-6 text-[var(--color-brand-600)]" />
                  ) : (
                    <Upload className="w-6 h-6 text-[var(--color-text-muted)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                  <span className="font-medium text-[var(--color-brand-600)]">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">PDF only, max 10MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
