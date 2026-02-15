"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
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
  patient_id: string;
  status: string;
  review_data: any;
  created_at: string;
  patients: { first_name: string | null; last_name: string | null } | null;
}

interface ReviewTabProps {
  patients: PatientOption[];
  initialReviews: ReviewItem[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReviewTab({ patients, initialReviews }: ReviewTabProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);

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
    if (!selectedPatientId) return;
    if (!hasSupplements) {
      toast.error("This patient has no supplements on file.");
      return;
    }
    startReview(selectedPatientId);
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

  const inlinePatientName = selectedPatient
    ? [selectedPatient.first_name, selectedPatient.last_name]
        .filter(Boolean)
        .join(" ") || "Unnamed Patient"
    : "";

  return (
    <div className="space-y-6">
      {/* Generate new review form */}
      {!isGenerating && !isComplete && (
        <div className="space-y-4">
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
              onChange={(e) => setSelectedPatientId(e.target.value)}
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

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!selectedPatientId || !hasSupplements}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
              >
                View full page &rarr;
              </Link>
            )}
          </div>
          <SupplementReviewDetail
            review={inlineReview}
            patientName={inlinePatientName}
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
                : "Unknown Patient";

              return (
                <Link
                  key={review.id}
                  href={`/supplements/review/${review.id}`}
                  className="block p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:shadow-sm transition-all"
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
            No supplement reviews yet. Select a patient above to generate your
            first review.
          </p>
        </div>
      )}
    </div>
  );
}
