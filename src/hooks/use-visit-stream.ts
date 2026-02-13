"use client";

import { useState, useCallback, useRef } from "react";

type SectionName = "soap" | "ifm_matrix" | "protocol";
type SectionStatus = "idle" | "generating" | "streaming" | "complete" | "error";

interface SoapData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface SectionState {
  status: SectionStatus;
  rawText: string;
  data: any;
}

interface VisitStreamState {
  soap: SectionState;
  ifm_matrix: SectionState;
  protocol: SectionState;
  isGenerating: boolean;
  error: string | null;
}

const DEFAULT_SECTION: SectionState = {
  status: "idle",
  rawText: "",
  data: null,
};

export function useVisitStream() {
  const [state, setState] = useState<VisitStreamState>({
    soap: { ...DEFAULT_SECTION },
    ifm_matrix: { ...DEFAULT_SECTION },
    protocol: { ...DEFAULT_SECTION },
    isGenerating: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (visitId: string, rawNotes: string, sections?: SectionName[]) => {
    // Abort any in-flight generation
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      soap: { ...DEFAULT_SECTION },
      ifm_matrix: { ...DEFAULT_SECTION },
      protocol: { ...DEFAULT_SECTION },
      isGenerating: true,
      error: null,
    });

    try {
      const res = await fetch(`/api/visits/${visitId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_notes: rawNotes,
          sections: sections || ["soap", "ifm_matrix", "protocol"],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
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
            const section = event.section as SectionName | "complete" | "error";

            if (section === "complete") {
              setState((prev) => ({ ...prev, isGenerating: false }));
              continue;
            }

            if (section === "error") {
              setState((prev) => ({
                ...prev,
                isGenerating: false,
                error: event.message || "Generation error",
              }));
              continue;
            }

            if (section === "soap" || section === "ifm_matrix" || section === "protocol") {
              setState((prev) => {
                const sectionState = { ...prev[section] };

                if (event.status === "generating") {
                  sectionState.status = "generating";
                } else if (event.status === "streaming") {
                  sectionState.status = "streaming";
                  sectionState.rawText += event.text || "";
                } else if (event.status === "complete") {
                  sectionState.status = "complete";
                  sectionState.data = event.data;
                }

                return { ...prev, [section]: sectionState };
              });
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: err.message || "Generation failed",
      }));
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isGenerating: false }));
  }, []);

  return {
    ...state,
    generate,
    abort,
  };
}
