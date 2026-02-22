"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, AlertCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useSupplementReview } from "@/hooks/use-supplement-review";
import { SupplementReviewStream } from "./supplement-review-stream";
import { SupplementReviewDetail } from "./supplement-review-detail";
import { ReviewStatusBadge } from "./review-status-badge";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  supplements: string | null;
  current_medications: string | null;
}

interface ReviewItem {
  id: string;
  patient_id: string | null;
  status: string;
  review_data: any;
  created_at: string;
  patients: { first_name: string | null; last_name: string | null } | null;
}

interface ReviewTabProps {
  patients: PatientOption[];
  initialReviews: ReviewItem[];
  selectedPatientId: string;
  onPatientChange: (id: string) => void;
}

type ReviewMode = "patient" | "freeform";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReviewTab({ patients, initialReviews, selectedPatientId, onPatientChange }: ReviewTabProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [mode, setMode] = useState<ReviewMode>("patient");

  // Freeform state
  const [freeformSupplements, setFreeformSupplements] = useState("");
  const [freeformMedications, setFreeformMedications] = useState("");
  const [freeformContext, setFreeformContext] = useState("");
  const [showStructuredInput, setShowStructuredInput] = useState(false);
  const [structName, setStructName] = useState("");
  const [structDosage, setStructDosage] = useState("");
  const [structForm, setStructForm] = useState("");

  const {
    status,
    rawText,
    reviewData,
    reviewId,
    error,
    startReview,
    abort,
  } = useSupplementReview();

  const isGenerating = status === "generating" || status === "streaming";
  const isComplete = status === "complete" && reviewData;

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const hasSupplements = !!selectedPatient?.supplements?.trim();

  function handleGenerate() {
    if (mode === "patient") {
      if (!selectedPatientId) return;
      if (!hasSupplements) {
        toast.error("This patient has no supplements on file.");
        return;
      }
      startReview({ patient_id: selectedPatientId });
    } else {
      if (!freeformSupplements.trim()) {
        toast.error("Enter at least one supplement to review.");
        return;
      }
      startReview({
        supplements: freeformSupplements.trim(),
        medications: freeformMedications.trim() || undefined,
        medical_context: freeformContext.trim() || undefined,
      });
    }
  }

  function handleAddStructuredItem() {
    if (!structName.trim()) return;
    const parts = [structName.trim()];
    if (structDosage.trim()) parts.push(structDosage.trim());
    if (structForm.trim()) parts.push(`(${structForm.trim()})`);
    const line = parts.join(" ");

    setFreeformSupplements((prev) =>
      prev.trim() ? `${prev.trim()}\n${line}` : line
    );
    setStructName("");
    setStructDosage("");
    setStructForm("");
  }

  // Build the inline review object for detail display after generation
  const inlineReview = isComplete
    ? {
        id: reviewId || "",
        status: "complete",
        review_data: reviewData,
        created_at: new Date().toISOString(),
      }
    : null;

  const inlinePatientName =
    mode === "patient" && selectedPatient
      ? [selectedPatient.first_name, selectedPatient.last_name]
          .filter(Boolean)
          .join(" ") || "Unnamed Patient"
      : "Freeform Review";

  const canGenerate =
    mode === "patient"
      ? !!selectedPatientId && hasSupplements
      : !!freeformSupplements.trim();

  return (
    <div className="space-y-6">
      {/* Generate new review form */}
      {!isGenerating && !isComplete && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] w-fit">
            <button
              onClick={() => setMode("patient")}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                mode === "patient"
                  ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              For a Patient
            </button>
            <button
              onClick={() => setMode("freeform")}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                mode === "freeform"
                  ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              Freeform
            </button>
          </div>

          {mode === "patient" ? (
            <>
              {/* Patient selector */}
              <div>
                <label
                  htmlFor="review-patient"
                  className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                >
                  Select Patient
                </label>
                <select
                  id="review-patient"
                  value={selectedPatientId}
                  onChange={(e) => onPatientChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {[p.first_name, p.last_name].filter(Boolean).join(" ") ||
                        "Unnamed Patient"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplements preview */}
              {selectedPatient && (
                <div>
                  {hasSupplements ? (
                    <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                        Current Supplements
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                        {selectedPatient.supplements}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)]">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-700">
                        This patient has no supplements on file. Add supplements to
                        their profile before generating a review.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Freeform supplements textarea */}
              <div>
                <label
                  htmlFor="freeform-supplements"
                  className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                >
                  Supplements
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  id="freeform-supplements"
                  value={freeformSupplements}
                  onChange={(e) => setFreeformSupplements(e.target.value)}
                  placeholder="Enter supplements, one per line or comma-separated&#10;e.g., Vitamin D3 5000 IU, Fish Oil 2g, Magnesium Glycinate 400mg"
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent resize-y"
                />
              </div>

              {/* Structured item builder */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowStructuredInput(!showStructuredInput)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors"
                >
                  {showStructuredInput ? (
                    <X className="w-3 h-3" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {showStructuredInput
                    ? "Hide structured input"
                    : "Add structured item"}
                </button>
                {showStructuredInput && (
                  <div className="mt-2 p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={structName}
                          onChange={(e) => setStructName(e.target.value)}
                          placeholder="Vitamin D3"
                          className="w-full px-2.5 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddStructuredItem();
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={structDosage}
                          onChange={(e) => setStructDosage(e.target.value)}
                          placeholder="5000 IU"
                          className="w-24 px-2.5 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddStructuredItem();
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                          Form
                        </label>
                        <input
                          type="text"
                          value={structForm}
                          onChange={(e) => setStructForm(e.target.value)}
                          placeholder="softgel"
                          className="w-20 px-2.5 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddStructuredItem();
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddStructuredItem}
                        disabled={!structName.trim()}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Medications (optional) */}
              <div>
                <label
                  htmlFor="freeform-medications"
                  className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                >
                  Medications (optional)
                </label>
                <textarea
                  id="freeform-medications"
                  value={freeformMedications}
                  onChange={(e) => setFreeformMedications(e.target.value)}
                  placeholder="Enter current medications for interaction checking&#10;e.g., Levothyroxine 75mcg, Metformin 500mg"
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent resize-y"
                />
              </div>

              {/* Medical context (optional) */}
              <div>
                <label
                  htmlFor="freeform-context"
                  className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
                >
                  Medical Context (optional)
                </label>
                <textarea
                  id="freeform-context"
                  value={freeformContext}
                  onChange={(e) => setFreeformContext(e.target.value)}
                  placeholder="Conditions, allergies, chief complaints, or other relevant context"
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent resize-y"
                />
              </div>
            </>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Generate Review
          </button>
        </div>
      )}

      {/* Streaming display */}
      {isGenerating && (
        <SupplementReviewStream
          status={status as "generating" | "streaming"}
          rawText={rawText}
          onAbort={abort}
        />
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]"
        >
          {error}
        </div>
      )}

      {/* Completed inline review */}
      {isComplete && inlineReview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Review Complete
            </h3>
            {reviewId && (
              <Link
                href={`/supplements/review/${reviewId}`}
                className="text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors"
              >
                View full page &rarr;
              </Link>
            )}
          </div>
          <SupplementReviewDetail
            review={inlineReview}
            patientName={inlinePatientName}
            patientId={mode === "patient" ? selectedPatientId : undefined}
          />
        </div>
      )}

      {/* Past reviews list */}
      {reviews.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Past Reviews ({reviews.length})
          </h3>
          <div className="space-y-2">
            {reviews.map((review) => {
              const patientName = review.patients
                ? [review.patients.first_name, review.patients.last_name]
                    .filter(Boolean)
                    .join(" ") || "Unnamed Patient"
                : review.patient_id
                  ? "Unknown Patient"
                  : "Freeform Review";

              return (
                <Link
                  key={review.id}
                  href={`/supplements/review/${review.id}`}
                  className="block p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {patientName}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                    <ReviewStatusBadge status={review.status} />
                  </div>
                  {review.review_data?.summary && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-2">
                      {review.review_data.summary}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reviews.length === 0 && !isGenerating && !isComplete && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-text-muted)]">
            No supplement reviews yet. Select a patient or use freeform mode to
            generate your first review.
          </p>
        </div>
      )}
    </div>
  );
}
