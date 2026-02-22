"use client";

import { useState, useCallback, useRef } from "react";
import type { SupplementReviewData } from "@/types/database";

interface SupplementReviewState {
  status: "idle" | "generating" | "streaming" | "complete" | "error";
  rawText: string;
  reviewData: SupplementReviewData | null;
  reviewId: string | null;
  error: string | null;
}

const DEFAULT_STATE: SupplementReviewState = {
  status: "idle",
  rawText: "",
  reviewData: null,
  reviewId: null,
  error: null,
};

export function useSupplementReview() {
  const [state, setState] = useState<SupplementReviewState>({
    ...DEFAULT_STATE,
  });

  const abortRef = useRef<AbortController | null>(null);

  const startReview = useCallback(
    async (
      params:
        | { patient_id: string }
        | { supplements: string; medications?: string; medical_context?: string }
    ) => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        status: "generating",
        rawText: "",
        reviewData: null,
        reviewId: null,
        error: null,
      });

      try {
        const res = await fetch("/api/supplements/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: controller.signal,
        });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Review generation failed");
      }

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
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;

          try {
            const event = JSON.parse(payload);

            switch (event.type) {
              case "review_id":
                setState((prev) => ({
                  ...prev,
                  reviewId: event.review_id,
                }));
                break;

              case "text_delta":
                setState((prev) => ({
                  ...prev,
                  status: "streaming",
                  rawText: prev.rawText + (event.text || ""),
                }));
                break;

              case "review_complete":
                setState((prev) => ({
                  ...prev,
                  status: "complete",
                  reviewData: event.data,
                  reviewId: event.review_id || prev.reviewId,
                }));
                break;

              case "error":
                throw new Error(event.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled — keep partial results if we have them
        setState((prev) => ({
          ...prev,
          status: prev.rawText ? "complete" : "idle",
        }));
        return;
      }
      const errorMessage =
        err instanceof Error ? err.message : "Review generation failed";
      setState((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
      }));
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setState((prev) => {
          if (prev.status === "generating" || prev.status === "streaming") {
            return { ...prev, status: "complete" };
          }
          return prev;
        });
      }
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    ...state,
    startReview,
    abort,
  };
}
