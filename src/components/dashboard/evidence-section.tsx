import Link from "next/link";
import { Lock, CheckCircle2, Library } from "lucide-react";

interface Partner {
  acronym: string;
  name: string;
  description: string;
  bg: string;
  text: string;
}

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

/** Visual styles for known partnership slugs */
const PARTNERSHIP_STYLES: Record<string, { bg: string; text: string; acronym: string }> = {
  "apex-energetics": { bg: "#4c1d95", text: "#ffffff", acronym: "Apex" },
};

const PARTNERS: Partner[] = [
  {
    acronym: "A4M",
    name: "American Academy of Anti-Aging Medicine",
    description: "Anti-aging & longevity protocols",
    bg: "#1a4731",
    text: "#ffffff",
  },
  {
    acronym: "IFM",
    name: "Institute for Functional Medicine",
    description: "Functional medicine frameworks",
    bg: "#0f5c58",
    text: "#ffffff",
  },
  {
    acronym: "CC",
    name: "Cleveland Clinic",
    description: "Clinical protocols & research",
    bg: "#1e3a6e",
    text: "#ffffff",
  },
  {
    acronym: "Cochrane",
    name: "Cochrane",
    description: "Systematic reviews & meta-analyses",
    bg: "#7c2d12",
    text: "#ffffff",
  },
  {
    acronym: "PubMed",
    name: "National Library of Medicine",
    description: "Peer-reviewed research database",
    bg: "#0c4a6e",
    text: "#ffffff",
  },
  {
    acronym: "AAFP",
    name: "American Academy of Family Physicians",
    description: "Primary care clinical guidelines",
    bg: "#3b1f6e",
    text: "#ffffff",
  },
  {
    acronym: "ACP",
    name: "American College of Physicians",
    description: "Internal medicine guidelines",
    bg: "#1e4d3b",
    text: "#ffffff",
  },
  {
    acronym: "Endo",
    name: "Endocrine Society",
    description: "Endocrinology & metabolism",
    bg: "#5b2d6e",
    text: "#ffffff",
  },
  {
    acronym: "ACG",
    name: "American College of Gastroenterology",
    description: "GI & digestive health guidelines",
    bg: "#7c1d3a",
    text: "#ffffff",
  },
];

function PartnerMark({ acronym, bg, text }: { acronym: string; bg: string; text: string }) {
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mb-3"
      style={{ backgroundColor: bg }}
    >
      <span
        className="font-bold text-[10px] tracking-tight leading-none text-center px-0.5"
        style={{ color: text }}
      >
        {acronym}
      </span>
    </div>
  );
}

function ProCard({ partner }: { partner: Partner }) {
  return (
    <div className="relative rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all">
      {/* Active badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-[var(--color-brand-500)]" />
        <span className="text-[10px] font-medium text-[var(--color-brand-600)]">Active</span>
      </div>

      <PartnerMark acronym={partner.acronym} bg={partner.bg} text={partner.text} />

      <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug mb-1 pr-12">
        {partner.name}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">{partner.description}</p>
    </div>
  );
}

function LockedCard({ partner }: { partner: Partner }) {
  return (
    <div className="relative rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 overflow-hidden">
      <PartnerMark acronym={partner.acronym} bg="#9ca3af" text="#ffffff" />
      <p className="text-sm font-semibold text-[var(--color-text-muted)] leading-snug mb-1 pr-8">
        {partner.name}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] opacity-60">{partner.description}</p>
    </div>
  );
}

function PartnershipCard({ partnership, isGranted }: { partnership: PartnershipRecord; isGranted: boolean }) {
  const style = PARTNERSHIP_STYLES[partnership.slug] ?? { bg: "#374151", text: "#ffffff", acronym: partnership.name.slice(0, 4) };
  return (
    <div className="relative rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 hover:border-purple-300 hover:shadow-[var(--shadow-card)] transition-all">
      {isGranted && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-purple-500" />
          <span className="text-[10px] font-medium text-purple-600">Active</span>
        </div>
      )}
      <PartnerMark acronym={style.acronym} bg={style.bg} text={style.text} />
      <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug mb-1 pr-12">
        {partnership.name}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">{partnership.description ?? "Partner knowledge base"}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-600">
        <Library className="w-3 h-3" />
        <span>Partner KB</span>
      </div>
    </div>
  );
}

interface EvidenceSectionProps {
  isFree: boolean;
  partnerships?: PartnershipRecord[];
  practitionerPartnerships?: PractitionerPartnershipRecord[];
}

export function EvidenceSection({ isFree, partnerships = [], practitionerPartnerships = [] }: EvidenceSectionProps) {
  if (isFree) {
    return (
      <div className="w-full mt-10">
        {/* Divider */}
        <div className="border-t border-[var(--color-border-light)] mb-8" />

        <div className="text-center mb-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Unlock evidence from leading medical organizations
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Pro members get direct access to {9 + partnerships.length} curated research databases{partnerships.length > 0 ? " + partner knowledge bases" : ""}
          </p>
        </div>

        {/* Locked grid */}
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 select-none pointer-events-none opacity-40 grayscale">
            {PARTNERS.map((p) => (
              <LockedCard key={p.acronym} partner={p} />
            ))}
            {partnerships.map((p) => {
              const style = PARTNERSHIP_STYLES[p.slug] ?? { bg: "#9ca3af", text: "#ffffff", acronym: p.name.slice(0, 4) };
              return (
                <LockedCard
                  key={p.slug}
                  partner={{ acronym: style.acronym, name: p.name, description: p.description ?? "Partner knowledge base", bg: style.bg, text: style.text }}
                />
              );
            })}
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/85 to-transparent rounded-[var(--radius-md)]">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-6 py-5 shadow-[var(--shadow-elevated)] text-center max-w-xs">
              <div className="w-9 h-9 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-4 h-4 text-[var(--color-brand-600)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                Pro Evidence Access
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
                Unlock 9 evidence databases including A4M, IFM, Cleveland Clinic, Cochrane, and more.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[var(--color-brand-600)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors"
              >
                Upgrade to Pro — $99/mo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-10">
      {/* Divider */}
      <div className="border-t border-[var(--color-border-light)] mb-8" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Active evidence sources
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {9 + partnerships.length} databases included with your Pro plan
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
          <span className="text-[11px] font-medium text-[var(--color-brand-700)]">All Active</span>
        </div>
      </div>

      {/* Partner grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PARTNERS.map((p) => (
          <ProCard key={p.acronym} partner={p} />
        ))}
      </div>

      {/* Partnership knowledge bases */}
      {partnerships.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-8 mb-4">
            <Library className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Partner Knowledge Bases
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {partnerships.map((p) => {
              const grantedSlugs = new Set(
                practitionerPartnerships
                  .filter((pp) => pp.partnerships?.slug)
                  .map((pp) => pp.partnerships!.slug)
              );
              return (
                <PartnershipCard
                  key={p.slug}
                  partnership={p}
                  isGranted={grantedSlugs.has(p.slug)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
