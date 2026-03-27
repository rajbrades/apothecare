import Link from "next/link";
import Image from "next/image";
import { Lock, Library, ExternalLink } from "lucide-react";

export interface PartnershipRecord {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
}

export interface PractitionerPartnershipRecord {
  partnership_id: string;
  is_active: boolean;
  partnerships: PartnershipRecord | null;
}

// ── Evidence source definitions ──────────────────────────────────────────

interface EvidenceSource {
  id: string;
  name: string;
  description: string;
  url: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
  category: "guidelines" | "research" | "specialty";
}

const SOURCES: EvidenceSource[] = [
  {
    id: "pubmed",
    name: "National Library of Medicine",
    description: "30M+ peer-reviewed biomedical citations",
    url: "https://pubmed.ncbi.nlm.nih.gov",
    logo: "/logos/pubmed.svg",
    logoWidth: 90,
    logoHeight: 24,
    category: "research",
  },
  {
    id: "cochrane",
    name: "Cochrane Library",
    description: "Gold-standard systematic reviews & meta-analyses",
    url: "https://www.cochranelibrary.com",
    logo: "/logos/cochrane.svg",
    logoWidth: 90,
    logoHeight: 24,
    category: "research",
  },
  {
    id: "ifm",
    name: "Institute for Functional Medicine",
    description: "Functional medicine frameworks & protocols",
    url: "https://www.ifm.org",
    logo: "/logos/ifm.svg",
    logoWidth: 42,
    logoHeight: 24,
    category: "guidelines",
  },
  {
    id: "a4m",
    name: "American Academy of Anti-Aging Medicine",
    description: "Anti-aging & longevity protocols",
    url: "https://www.a4m.com",
    logo: "/logos/a4m.svg",
    logoWidth: 42,
    logoHeight: 24,
    category: "guidelines",
  },
  {
    id: "cleveland-clinic",
    name: "Cleveland Clinic",
    description: "Clinical protocols & research guidelines",
    url: "https://my.clevelandclinic.org",
    logo: "/logos/cleveland-clinic.svg",
    logoWidth: 120,
    logoHeight: 24,
    category: "guidelines",
  },
  {
    id: "aafp",
    name: "American Academy of Family Physicians",
    description: "Primary care clinical guidelines",
    url: "https://www.aafp.org",
    logo: "/logos/aafp.svg",
    logoWidth: 58,
    logoHeight: 24,
    category: "guidelines",
  },
  {
    id: "acp",
    name: "American College of Physicians",
    description: "Internal medicine evidence reviews",
    url: "https://www.acponline.org",
    logo: "/logos/acp.svg",
    logoWidth: 50,
    logoHeight: 24,
    category: "specialty",
  },
  {
    id: "endocrine",
    name: "The Endocrine Society",
    description: "Endocrinology & metabolism guidelines",
    url: "https://www.endocrine.org",
    logo: "/logos/endocrine-society.svg",
    logoWidth: 130,
    logoHeight: 24,
    category: "specialty",
  },
  {
    id: "acg",
    name: "American College of Gastroenterology",
    description: "GI & digestive health guidelines",
    url: "https://gi.org",
    logo: "/logos/acg.svg",
    logoWidth: 50,
    logoHeight: 24,
    category: "specialty",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  research: "Research Databases",
  guidelines: "Clinical Guidelines",
  specialty: "Specialty Societies",
};

const CATEGORY_ORDER = ["research", "guidelines", "specialty"] as const;

const PARTNERSHIP_LOGOS: Record<string, { logo: string; width: number }> = {
  "apex-energetics": { logo: "/logos/apex-energetics.svg", width: 120 },
};

// ── Components ────────────────────────────────────────────────────────────

function SourceRow({ source, locked }: { source: EvidenceSource; locked?: boolean }) {
  return (
    <div className={`group flex items-center gap-4 px-4 py-3 rounded-lg border transition-all ${
      locked
        ? "border-transparent opacity-30 grayscale"
        : "border-[var(--color-border-light)] hover:border-[var(--color-brand-200)] hover:bg-[var(--color-brand-50)]/30"
    }`}>
      {/* Logo */}
      <div className="w-[130px] flex-shrink-0 flex items-center h-6">
        <Image
          src={source.logo}
          alt={source.name}
          width={source.logoWidth}
          height={source.logoHeight}
          className="object-contain object-left"
        />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{source.name}</p>
        <p className="text-[11px] text-[var(--color-text-muted)] truncate">{source.description}</p>
      </div>
      {/* External link on hover */}
      {!locked && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        </a>
      )}
    </div>
  );
}

function PartnershipRow({ partnership, isGranted }: { partnership: PartnershipRecord; isGranted: boolean }) {
  const style = PARTNERSHIP_LOGOS[partnership.slug];

  return (
    <div className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-purple-100 bg-purple-50/30 hover:border-purple-200 transition-all">
      <div className="w-[130px] flex-shrink-0 flex items-center h-6">
        {style ? (
          <Image src={style.logo} alt={partnership.name} width={style.width} height={24} className="object-contain object-left" />
        ) : (
          <span className="font-bold text-sm text-[var(--color-text-primary)]">{partnership.name}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{partnership.name}</p>
        <p className="text-[11px] text-[var(--color-text-muted)] truncate">{partnership.description ?? "Partner knowledge base"}</p>
      </div>
      {isGranted && (
        <div className="flex-shrink-0 flex items-center gap-1">
          <Library className="w-3 h-3 text-purple-500" />
          <span className="text-[10px] font-medium text-purple-600">RAG</span>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface EvidenceSectionProps {
  isFree: boolean;
  partnerships?: PartnershipRecord[];
  practitionerPartnerships?: PractitionerPartnershipRecord[];
}

export function EvidenceSection({ isFree, partnerships = [], practitionerPartnerships = [] }: EvidenceSectionProps) {
  const totalSources = SOURCES.length + partnerships.length;

  if (isFree) {
    return (
      <div className="w-full mt-10">
        <div className="border-t border-[var(--color-border-light)] mb-8" />

        <div className="text-center mb-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Evidence-backed clinical intelligence
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Pro members get access to {totalSources} curated evidence sources
          </p>
        </div>

        <div className="relative">
          <div className="space-y-1.5 select-none pointer-events-none">
            {SOURCES.slice(0, 5).map((s) => (
              <SourceRow key={s.id} source={s} locked />
            ))}
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/90 to-transparent rounded-lg">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-8 py-6 shadow-[var(--shadow-elevated)] text-center max-w-sm">
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-4.5 h-4.5 text-[var(--color-brand-600)]" />
              </div>
              <p className="text-base font-semibold text-[var(--color-text-primary)] mb-1.5">
                Pro Evidence Access
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-5 leading-relaxed">
                Unlock {totalSources} evidence databases including PubMed, Cochrane, IFM, Cleveland Clinic, and more.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-[var(--color-brand-900)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors"
              >
                Upgrade to Pro — $99/mo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat],
    sources: SOURCES.filter((s) => s.category === cat),
  }));

  const grantedSlugs = new Set(
    practitionerPartnerships
      .filter((pp) => pp.partnerships?.slug)
      .map((pp) => pp.partnerships!.slug)
  );

  return (
    <div className="w-full mt-10">
      <div className="border-t border-[var(--color-border-light)] mb-8" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Evidence sources
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {totalSources} databases powering your clinical intelligence
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-700">All Active</span>
        </div>
      </div>

      {/* Categorized sources */}
      <div className="space-y-6">
        {grouped.map(({ key, label, sources }) => (
          <div key={key}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 px-1">
              {label}
            </p>
            <div className="space-y-1.5">
              {sources.map((s) => (
                <SourceRow key={s.id} source={s} />
              ))}
            </div>
          </div>
        ))}

        {/* Partner knowledge bases */}
        {partnerships.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-500 mb-2 px-1 flex items-center gap-1.5">
              <Library className="w-3 h-3" />
              Partner Knowledge Bases
            </p>
            <div className="space-y-1.5">
              {partnerships.map((p) => (
                <PartnershipRow
                  key={p.slug}
                  partnership={p}
                  isGranted={grantedSlugs.has(p.slug)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
