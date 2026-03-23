// ===========================================
// Evidence Source Filter — Types, Presets, Prompts
// ===========================================

export interface EvidenceSource {
  id: string;
  name: string;
  fullName: string;
  category: "functional" | "conventional" | "general" | "partnership";
}

export const EVIDENCE_SOURCES: Record<string, EvidenceSource> = {
  ifm: { id: "ifm", name: "IFM", fullName: "Institute for Functional Medicine", category: "functional" },
  a4m: { id: "a4m", name: "A4M", fullName: "American Academy of Anti-Aging Medicine", category: "functional" },
  cleveland_clinic: { id: "cleveland_clinic", name: "Cleveland Clinic", fullName: "Cleveland Clinic Center for Functional Medicine", category: "functional" },
  pubmed: { id: "pubmed", name: "PubMed", fullName: "PubMed / NIH Literature", category: "general" },
  cochrane: { id: "cochrane", name: "Cochrane", fullName: "Cochrane Library", category: "general" },
  aafp: { id: "aafp", name: "AAFP", fullName: "American Academy of Family Physicians", category: "conventional" },
  acp: { id: "acp", name: "ACP", fullName: "American College of Physicians", category: "conventional" },
  endocrine_society: { id: "endocrine_society", name: "Endocrine Society", fullName: "Endocrine Society", category: "conventional" },
  acg: { id: "acg", name: "ACG", fullName: "American College of Gastroenterology", category: "conventional" },
  // Partnership knowledge bases
  apex_energetics: { id: "apex_energetics", name: "Apex Energetics", fullName: "Apex Energetics", category: "partnership" },
} as const;

export type SourceId = keyof typeof EVIDENCE_SOURCES;

export const ALL_SOURCE_IDS = Object.keys(EVIDENCE_SOURCES) as SourceId[];

export interface SourcePreset {
  id: string;
  name: string;
  description: string;
  sources: SourceId[];
}

export const SOURCE_PRESETS: SourcePreset[] = [
  {
    id: "full_spectrum",
    name: "Full Spectrum",
    description: "All evidence sources",
    sources: [...ALL_SOURCE_IDS],
  },
  {
    id: "functional_core",
    name: "Functional Core",
    description: "IFM, A4M, Cleveland Clinic, Apex Energetics + PubMed",
    sources: ["ifm", "a4m", "cleveland_clinic", "apex_energetics", "pubmed"],
  },
  {
    id: "conventional_core",
    name: "Conventional Core",
    description: "AAFP, ACP, Endocrine Society, ACG + PubMed + Cochrane",
    sources: ["aafp", "acp", "endocrine_society", "acg", "pubmed", "cochrane"],
  },
];

export const DEFAULT_PRESET_ID = "full_spectrum";

/** Determine which preset matches the given source selection (if any) */
export function matchPreset(selectedSources: SourceId[]): SourcePreset | null {
  const sorted = [...selectedSources].sort();
  for (const preset of SOURCE_PRESETS) {
    const presetSorted = [...preset.sources].sort();
    if (
      sorted.length === presetSorted.length &&
      sorted.every((s, i) => s === presetSorted[i])
    ) {
      return preset;
    }
  }
  return null;
}

/** Get display label for current source selection */
export function getSourceLabel(selectedSources: SourceId[]): string {
  if (!selectedSources.length || selectedSources.length === ALL_SOURCE_IDS.length) {
    return "Sources";
  }
  const preset = matchPreset(selectedSources);
  if (preset) return preset.name;
  if (selectedSources.length === 1) {
    return EVIDENCE_SOURCES[selectedSources[0]]?.name || "Custom";
  }
  return `${selectedSources.length} Sources`;
}

/** Check if the selection is the default (all sources) */
export function isDefaultSelection(selectedSources: SourceId[]): boolean {
  return !selectedSources.length || selectedSources.length === ALL_SOURCE_IDS.length;
}

/** Get the matching sources for a clinical lens selection */
export function sourcesForLens(lens: "functional" | "conventional" | "both"): SourceId[] {
  if (lens === "functional") {
    return [...(SOURCE_PRESETS.find((p) => p.id === "functional_core")?.sources ?? [])];
  }
  if (lens === "conventional") {
    return [...(SOURCE_PRESETS.find((p) => p.id === "conventional_core")?.sources ?? [])];
  }
  return [...ALL_SOURCE_IDS];
}

/** Build system prompt addendum for source filtering */
export function buildSourceFilterAddendum(selectedSources: SourceId[]): string {
  if (isDefaultSelection(selectedSources)) return "";

  const sourceNames = selectedSources
    .map((id) => EVIDENCE_SOURCES[id]?.fullName)
    .filter(Boolean);

  return `

## Evidence Source Filter
For this query, prioritize and restrict your evidence citations to the following sources:
${sourceNames.map((n) => `- ${n}`).join("\n")}

When citing evidence, preferentially draw from these sources. If critical information is only available outside these sources, you may include it but clearly note it falls outside the selected evidence base. Label each citation with its source organization when possible.`;
}
