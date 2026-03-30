"use client";

import { useState, useCallback, useRef } from "react";

interface ProtocolStreamState {
  isGenerating: boolean;
  streamText: string;
  protocolId: string | null;
  phasesCount: number;
  error: string | null;
}

export function useProtocolStream() {
  const [state, setState] = useState<ProtocolStreamState>({
    isGenerating: false,
    streamText: "",
    protocolId: null,
    phasesCount: 0,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (
      patientId: string,
      focusAreas: string[],
      customInstructions?: string
    ) => {
      // Abort any in-flight generation
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        isGenerating: true,
        streamText: "",
        protocolId: null,
        phasesCount: 0,
        error: null,
      });

      try {
        const res = await fetch(
          `/api/patients/${patientId}/protocols/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              focus_areas: focusAreas,
              custom_instructions: customInstructions || undefined,
            }),
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `Generation failed (${res.status})`
          );
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

              if (event.type === "status") {
                setState((prev) => ({
                  ...prev,
                  streamText:
                    prev.streamText + (event.message ? `${event.message}\n` : ""),
                }));
              } else if (event.type === "streaming") {
                setState((prev) => ({
                  ...prev,
                  streamText: prev.streamText + (event.text || ""),
                }));
              } else if (event.type === "phase_complete") {
                setState((prev) => ({
                  ...prev,
                  phasesCount: prev.phasesCount + 1,
                }));
              } else if (event.type === "complete") {
                setState((prev) => ({
                  ...prev,
                  isGenerating: false,
                  protocolId: event.protocol_id || prev.protocolId,
                }));
              } else if (event.type === "error") {
                setState((prev) => ({
                  ...prev,
                  isGenerating: false,
                  error: event.message || "Generation error",
                }));
              }
            } catch {
              // Skip malformed SSE events
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error:
            err instanceof Error ? err.message : "Protocol generation failed",
        }));
      } finally {
        if (!abortRef.current?.signal.aborted) {
          setState((prev) => ({ ...prev, isGenerating: false }));
        }
      }
    },
    []
  );

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
