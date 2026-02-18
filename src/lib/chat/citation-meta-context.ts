"use client";

import { createContext } from "react";
import type { EvidenceLevel } from "@/components/chat/evidence-badge";

export interface CitationMeta {
  citationText: string;
  title: string;
  authors?: string[];
  year?: number;
  doi?: string;
  /** Journal or source name */
  source?: string;
  evidenceLevel?: EvidenceLevel;
}

/**
 * React context that makes resolved citation metadata available to any
 * markdown renderer within an AssistantContent tree.
 *
 * Keyed by citation text (e.g. "Sinha, 2013") so the markdown `a` component
 * can look up metadata from the anchor's child text.
 */
export const CitationMetaContext = createContext<Map<string, CitationMeta>>(
  new Map()
);
