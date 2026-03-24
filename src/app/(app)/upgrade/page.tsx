import Link from "next/link";
import { Sparkles, ArrowLeft, FlaskConical, Stethoscope, Shield } from "lucide-react";

interface UpgradePageProps {
  searchParams: Promise<{ feature?: string; next?: string }>;
}

const FEATURE_DETAILS: Record<string, { icon: typeof FlaskConical; description: string }> = {
  Labs: {
    icon: FlaskConical,
    description:
      "Upload lab results, get AI-powered biomarker interpretation with functional ranges, and track trends over time.",
  },
  Visits: {
    icon: Stethoscope,
    description:
      "Document clinical encounters with AI-generated SOAP notes, IFM Matrix mapping, and protocol recommendations.",
  },
};

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const { feature = "This feature", next } = await searchParams;
  const details = FEATURE_DETAILS[feature];
  const FeatureIcon = details?.icon ?? Shield;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-[var(--color-gold-100)] flex items-center justify-center">
          <FeatureIcon size={28} className="text-[var(--color-gold-600)]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {feature} is a Pro feature
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">
            {details?.description ??
              "Upgrade to Pro to unlock this feature and the full clinical platform."}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-gold-200)] bg-[var(--color-gold-50)] p-6 space-y-4">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Everything in Pro
          </p>
          <ul className="text-xs text-[var(--color-text-secondary)] space-y-2 text-left">
            <li className="flex items-start gap-2">
              <Sparkles size={12} className="text-[var(--color-gold-500)] mt-0.5 shrink-0" />
              Unlimited clinical queries
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={12} className="text-[var(--color-gold-500)] mt-0.5 shrink-0" />
              9 evidence databases (A4M, IFM, Cleveland Clinic & more)
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={12} className="text-[var(--color-gold-500)] mt-0.5 shrink-0" />
              Lab interpretation & biomarker tracking
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={12} className="text-[var(--color-gold-500)] mt-0.5 shrink-0" />
              AI visit documentation & SOAP notes
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={12} className="text-[var(--color-gold-500)] mt-0.5 shrink-0" />
              Branded PDF exports & unlimited patients
            </li>
          </ul>
          <Link
            href="/settings#subscription"
            className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold bg-[var(--color-gold-500)] text-white hover:bg-[var(--color-gold-600)] transition-colors"
          >
            <Sparkles size={14} />
            Upgrade to Pro — $99/mo
          </Link>
        </div>

        <Link
          href={next && next.startsWith("/") && !next.startsWith("//") ? "/dashboard" : "/dashboard"}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <ArrowLeft size={12} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
