import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Video, ShieldCheck, FileText, Globe, AlertTriangle, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Telehealth Compliance",
  description:
    "Apothecare's telehealth compliance framework — state licensing requirements, informed consent, HIPAA telehealth safeguards, and practitioner responsibilities.",
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Video;
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

export default function TelehealthPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Hero */}
          <div className="mb-16 text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-4">
              Telehealth Compliance
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Apothecare is a clinical decision support tool, not a telehealth
              platform. This page describes how practitioners can use Apothecare
              responsibly in telehealth workflows.
            </p>
          </div>

          {/* Important notice */}
          <div className="mb-12 p-5 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed space-y-1">
              <p className="font-semibold">Important Disclaimer</p>
              <p>
                Apothecare does not provide video conferencing, real-time
                patient-provider communication, or any service that constitutes
                the practice of telemedicine or telehealth. Apothecare is
                exclusively a practitioner-side clinical documentation and
                decision-support tool. You are solely responsible for complying
                with all federal, state, and professional telehealth
                requirements applicable to your practice.
              </p>
            </div>
          </div>

          <Section icon={FileText} title="Practitioner Responsibilities">
            <p>
              If you use Apothecare to support telehealth encounters — for
              example, to document visits conducted via a separate video
              platform, or to generate clinical notes after a remote
              consultation — you remain solely and fully responsible for:
            </p>
            <BulletList
              items={[
                "Holding an active, valid license in every jurisdiction where you provide care to patients",
                "Complying with all applicable state and federal telehealth laws and regulations",
                "Obtaining and documenting informed consent for telehealth services in accordance with applicable law",
                "Using a separate HIPAA-compliant platform for any real-time video or audio communication with patients",
                "Maintaining your own policies and procedures for telehealth services",
                "Satisfying all applicable prescribing restrictions applicable to telehealth encounters",
                "Complying with any applicable requirements for establishing a valid patient-provider relationship before prescribing via telehealth",
              ]}
            />
            <p>
              Apothecare makes no representations about the legality or
              appropriateness of any particular telehealth practice or
              encounter. Nothing in Apothecare&apos;s outputs, documentation,
              or marketing materials constitutes legal, regulatory, or
              compliance advice.
            </p>
          </Section>

          <Section icon={Globe} title="State Licensing Requirements">
            <p>
              Telehealth practice is governed primarily by state law.
              Requirements vary significantly across jurisdictions, including:
            </p>
            <BulletList
              items={[
                "State-specific licensing requirements — most states require practitioners to hold an active license in the state where the patient is physically located at the time of the encounter",
                "Interstate compacts — certain professions (physicians, nurses, physical therapists, and others) participate in licensure compacts that may streamline multi-state practice",
                "Prescribing restrictions — some states impose additional requirements on prescribing medications via telehealth, including controlled substances",
                "Consent requirements — many states mandate specific informed consent disclosures for telehealth services",
                "Corporate practice of medicine — some states restrict the employment of physicians by non-physician entities and may affect telehealth business models",
              ]}
            />
            <p>
              Apothecare strongly encourages you to consult qualified legal
              counsel and review applicable state law before providing
              telehealth services across state lines or in any jurisdiction
              where you are uncertain of your obligations.
            </p>
          </Section>

          <Section icon={FileText} title="Informed Consent">
            <p>
              Many states and professional boards require practitioners to
              obtain written or verbal informed consent before conducting
              telehealth encounters. A compliant informed consent process
              typically should address:
            </p>
            <BulletList
              items={[
                "The nature of the telehealth encounter and how it differs from an in-person visit",
                "Limitations of telehealth services, including inability to perform a physical examination",
                "How the patient&apos;s health information will be transmitted and stored",
                "The right to discontinue telehealth services and seek in-person care",
                "Privacy and security of the communication platform",
                "Risks associated with receiving care remotely",
                "How to contact emergency services if needed",
              ]}
            />
            <p>
              Apothecare does not generate or store patient-facing informed
              consent documents. You are responsible for obtaining and
              retaining consent in accordance with your jurisdiction&apos;s
              requirements.
            </p>
          </Section>

          <Section icon={Lock} title="HIPAA and Telehealth Privacy">
            <p>
              The U.S. Department of Health and Human Services has issued
              guidance on HIPAA compliance in the context of telehealth.
              Key points include:
            </p>
            <BulletList
              items={[
                "Video platforms used for telehealth encounters must be HIPAA-compliant if the practitioner is a HIPAA-covered entity — this requires a Business Associate Agreement with the platform vendor",
                "Consumer-grade video tools (e.g., FaceTime, standard Zoom, Google Meet) may not be HIPAA-compliant without appropriate agreements in place",
                "Practitioners should implement reasonable safeguards to prevent unauthorized access to telehealth communications",
                "Telehealth encounters generate medical records that must be retained in accordance with applicable state and federal law",
              ]}
            />
            <p>
              Apothecare is a practitioner-side documentation tool and does
              not participate in real-time patient-provider communication.
              When you use Apothecare to document telehealth encounters,
              the same HIPAA obligations applicable to in-person visit
              documentation apply. Please refer to our{" "}
              <Link
                href="/security"
                className="text-[var(--color-brand-600)] hover:underline"
              >
                Security &amp; Compliance page
              </Link>{" "}
              for details on how Apothecare handles clinical data.
            </p>
          </Section>

          <Section icon={ShieldCheck} title="Ryan Haight Act and Controlled Substances">
            <p>
              Federal law — specifically the Ryan Haight Online Pharmacy
              Consumer Protection Act — generally requires an in-person
              medical evaluation before a practitioner may prescribe
              controlled substances via the internet, including via
              telehealth. This requirement has been subject to temporary
              waivers during public health emergencies, but those waivers
              are time-limited and subject to change.
            </p>
            <p>
              Apothecare does not generate prescriptions, prescription
              recommendations, or controlled substance orders. Any
              prescribing decisions remain entirely with the licensed
              practitioner. You are solely responsible for complying with
              the Ryan Haight Act, the Controlled Substances Act, applicable
              DEA regulations, and any relevant state controlled substance
              laws.
            </p>
          </Section>

          <Section icon={Video} title="Platform Requirements">
            <p>
              Apothecare does not provide telehealth video, audio, or
              real-time messaging services. If you use Apothecare alongside
              a telehealth platform, ensure that:
            </p>
            <BulletList
              items={[
                "Your video or communication platform is appropriate for HIPAA-covered use and that you have a Business Associate Agreement in place where required",
                "Patient data entered into Apothecare during or after telehealth encounters is subject to the same access controls and security practices as in-person patient data",
                "You do not share Apothecare-generated clinical notes or summaries through non-secure channels",
                "You maintain appropriate records of telehealth encounters in compliance with applicable state record-keeping requirements",
              ]}
            />
          </Section>

          <div className="mt-8 p-5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              This page is provided for general informational purposes only
              and does not constitute legal, regulatory, or compliance advice.
              Telehealth laws change frequently. Consult qualified legal
              counsel regarding the specific requirements applicable to your
              practice, patient population, and jurisdiction. For questions
              about how Apothecare handles your data, contact{" "}
              <a
                href="mailto:privacy@apothecare.com"
                className="text-[var(--color-brand-600)] hover:underline font-medium"
              >
                privacy@apothecare.com
              </a>
              .
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
