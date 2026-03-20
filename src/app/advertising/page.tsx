import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Megaphone, Shield, FlaskConical, BookOpen, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Advertising & Partnerships",
  description:
    "Apothecare's advertising policy, partnership disclosure, sponsored content guidelines, and evidence integrity commitments.",
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Megaphone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-brand-50)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4.5 h-4.5 text-[var(--color-brand-600)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
          {title}
        </h2>
      </div>
      <div className="pl-12 space-y-4 text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-400)] mt-2 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdvertisingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-3">
              Advertising &amp; Partnerships
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Last Updated: March 20, 2026
            </p>
          </div>

          <div className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed mb-12">
            <p>
              Apothecare is committed to transparency regarding how we work with
              commercial partners, how content in the platform may be influenced
              by those relationships, and how we protect the integrity of
              clinical evidence regardless of commercial considerations.
            </p>
            <p className="mt-4">
              This page explains our advertising practices, partnership
              disclosures, and the guardrails we maintain to ensure that
              commercial relationships do not compromise the accuracy or
              independence of clinical information provided through the platform.
            </p>
          </div>

          <Section icon={Megaphone} title="Advertising Policy">
            <p>
              Apothecare does not display traditional third-party advertising
              (banner ads, pop-ups, or sponsored listings) within the clinical
              application. Our revenue is derived from practitioner
              subscriptions, not from advertising to practitioners or patients.
            </p>
            <p>
              We do not sell practitioner data, patient data, or usage data to
              advertising networks or data brokers.
            </p>
            <p>
              From time to time, Apothecare may promote its own products,
              features, or subscription tiers within the application or in
              communications to users. These are clearly attributable to
              Apothecare and are not third-party advertisements.
            </p>
          </Section>

          <Section icon={Users} title="Commercial Partnerships">
            <p>
              Apothecare may enter into commercial partnerships with
              supplement manufacturers, nutraceutical companies, functional
              medicine organizations, laboratory service providers, and other
              healthcare-adjacent businesses. The nature of these relationships
              can include:
            </p>
            <BulletList
              items={[
                "Content partnerships — partners may provide educational content, clinical guidelines, or product information that is made available within the platform",
                "Brand formulary integration — practitioners may configure preferred brands (including partner brands) to appear in supplement protocol recommendations",
                "Educational materials — partners may sponsor educational content or clinical masterclasses accessible through the platform",
                "Co-marketing — Apothecare and partners may jointly promote features or services to practitioner audiences",
              ]}
            />
            <p>
              Where a commercial partnership may influence content visible within
              the platform, Apothecare will identify that content as
              partner-sourced or sponsored.
            </p>
          </Section>

          <Section icon={BookOpen} title="Current Partner Disclosures">
            <p>
              Apothecare currently maintains the following commercial
              partnerships that may affect content visible within the platform:
            </p>

            <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] overflow-hidden my-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)]">
                    <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-primary)]">Partner</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-primary)]">Relationship Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-primary)]">Content Affected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">Apex Energetics</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">Educational content partnership</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">Clinical masterclass materials available in knowledge base (e.g., thyroid protocols)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              This table will be updated as new partnerships are established or
              existing partnerships change. The absence of a partner from this
              table means Apothecare has no commercial relationship with that
              organization that affects platform content.
            </p>
          </Section>

          <Section icon={FlaskConical} title="Evidence Integrity Commitments">
            <p>
              Commercial relationships do not change the standards Apothecare
              applies to clinical evidence. We are committed to the following
              principles regardless of partner relationships:
            </p>
            <BulletList
              items={[
                "Evidence-first recommendations — supplement protocol and clinical recommendations are generated based on the practitioner's clinical query, patient context, and peer-reviewed literature, not on commercial relationships",
                "No pay-to-play citations — commercial partners cannot pay to have their products cited in AI-generated clinical outputs or to have their content ranked higher in evidence retrieval",
                "Source transparency — when content from a commercial partner is used in clinical responses, the source is identified so practitioners can assess potential bias",
                "Separate brand preferences from clinical recommendations — the brand formulary feature allows practitioners to configure preferred brands, but only appears after clinical recommendations are generated independently",
                "Citation verification — practitioners can verify, flag, and report inaccurate citations through the platform's citation feedback system",
                "No ghost-writing — Apothecare does not create content that falsely attributes commercial content to independent clinical sources",
              ]}
            />
          </Section>

          <Section icon={Shield} title="Practitioner Choice and Independence">
            <p>
              The brand formulary feature in Apothecare allows individual
              practitioners to configure which supplement brands they prefer to
              see in protocol recommendations. This is a practitioner-controlled
              preference, not a platform default. Specifically:
            </p>
            <BulletList
              items={[
                "Brand preferences are set by each practitioner individually in their account settings",
                "No brands are pre-selected by default — practitioners start with no brand restrictions",
                "Practitioners can configure any brand, including brands with no commercial relationship to Apothecare",
                "Clinical recommendations are generated before brand filtering is applied — brand preferences only affect the specific product or brand named, not the underlying clinical recommendation",
                "Practitioners can disable all brand filtering at any time",
              ]}
            />
            <p>
              We do not incentivize practitioners to configure any particular
              brand, and commercial partners do not pay for inclusion in a
              practitioner&apos;s brand formulary.
            </p>
          </Section>

          <Section icon={BookOpen} title="FTC Compliance">
            <p>
              Apothecare complies with applicable Federal Trade Commission
              guidelines regarding endorsements, testimonials, and material
              connections. Where content in the platform or in Apothecare
              marketing materials reflects a material connection between
              Apothecare and a third party (such as a commercial partnership,
              compensation, or free products or services), that connection
              will be clearly disclosed.
            </p>
            <p>
              If you believe any content in the platform or in Apothecare
              communications fails to adequately disclose a material
              commercial relationship, please contact us at{" "}
              <a
                href="mailto:legal@apothecare.com"
                className="text-[var(--color-brand-600)] hover:underline font-medium"
              >
                legal@apothecare.com
              </a>
              .
            </p>
          </Section>

          <div className="mt-8 p-5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Questions about Apothecare&apos;s partnership or advertising
              practices? Contact us at{" "}
              <a
                href="mailto:partnerships@apothecare.com"
                className="text-[var(--color-brand-600)] hover:underline font-medium"
              >
                partnerships@apothecare.com
              </a>{" "}
              or review our{" "}
              <Link
                href="/terms"
                className="text-[var(--color-brand-600)] hover:underline"
              >
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link
                href="/security"
                className="text-[var(--color-brand-600)] hover:underline"
              >
                Security &amp; Compliance
              </Link>{" "}
              pages for additional context.
            </p>
          </div>

          {/* Back link */}
          <div className="mt-16 pt-8 border-t border-[var(--color-border-light)] text-center">
            <Link
              href="/"
              className="text-sm text-[var(--color-brand-600)] hover:underline"
            >
              &larr; Back to Apothecare
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
