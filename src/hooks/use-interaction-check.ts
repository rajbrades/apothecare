"use client";

import { useState, useCallback, useRef } from "react";
import type { InteractionCheckData } from "@/types/database";

interface InteractionCheckState {
  status: "idle" | "generating" | "streaming" | "complete" | "error";
  rawText: string;
  checkData: InteractionCheckData | null;
  checkId: string | null;
  error: string | null;
}

const DEFAULT_STATE: InteractionCheckState = {
  status: "idle",
  rawText: "",
  checkData: null,
  checkId: null,
  error: null,
};

export function useInteractionCheck() {
  const [state, setState] = useState<InteractionCheckState>({
    ...DEFAULT_STATE,
  });

  const abortRef = useRef<AbortController | null>(null);

  const runCheck = useCallback(
    async (
      supplements: string,
      medications: string,
      patientId?: string | null
    ) => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        status: "generating",
        rawText: "",
        checkData: null,
        checkId: null,
        error: null,
      });

      try {
        const res = await fetch("/api/supplements/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplements,
            medications,
            patient_id: patientId || null,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Interaction check failed");
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
                case "check_id":
                  setState((prev) => ({
                    ...prev,
                    checkId: event.check_id,
                  }));
                  break;

                case "text_delta":
                  setState((prev) => ({
                    ...prev,
                    status: "streaming",
                    rawText: prev.rawText + (event.text || ""),
                  }));
                  break;

                case "check_complete":
                  setState((prev) => ({
                    ...prev,
                    status: "complete",
                    checkData: event.data,
                    checkId: event.check_id || prev.checkId,
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
          err instanceof Error ? err.message : "Interaction check failed";
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
    },
    []
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    ...state,
    runCheck,
    abort,
  };
}
