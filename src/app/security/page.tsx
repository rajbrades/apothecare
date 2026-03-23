import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Shield, Lock, Server, Activity, FileCheck, Brain, AlertTriangle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Compliance",
  description:
    "How Apothecare protects sensitive clinical data with HIPAA-aligned practices, encryption, audit logging, and healthcare-grade security controls.",
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
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
      <div className="pl-0 sm:pl-12 space-y-4 text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
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

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Hero */}
          <div className="mb-16 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-4">
              Security and Compliance
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Apothecare is built with a strong focus on protecting sensitive
              data, maintaining system reliability, and supporting
              healthcare-grade security practices.
            </p>
          </div>

          <div className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed mb-12">
            <p>
              We use layered administrative, technical, and organizational
              safeguards designed to help protect information against
              unauthorized access, disclosure, alteration, and loss. We
              continuously evaluate and improve our controls as our platform,
              infrastructure, and regulatory environment evolve. Our approach is
              informed by widely recognized security frameworks, including the
              NIST Cybersecurity Framework 2.0.
            </p>
          </div>

          {/* Regulatory Alignment */}
          <Section icon={FileCheck} title="Regulatory Alignment">
            <p>
              Apothecare is designed to support organizations operating in
              regulated healthcare environments. Where applicable, we align our
              security and privacy practices with the U.S. Health Insurance
              Portability and Accountability Act, including the HIPAA Privacy
              Rule, Security Rule, and Breach Notification Rule. These rules
              govern the use, disclosure, safeguarding, and breach response
              obligations related to protected health information.
            </p>
            <p>
              For customers that qualify as HIPAA covered entities or business
              associates, Apothecare may support the handling of protected health
              information subject to an executed Business Associate Agreement and
              appropriate implementation controls. Any HIPAA-related commitments
              apply only to the services, configurations, and workflows covered
              by the applicable agreement.
            </p>
            <p>
              In addition to HIPAA, certain digital health products may also be
              subject to the FTC Health Breach Notification Rule, which can apply
              to health apps, connected devices, and similar technologies that
              are not covered by HIPAA.
            </p>
          </Section>

          {/* Infrastructure Security */}
          <Section icon={Server} title="Infrastructure Security">
            <p>
              Apothecare uses reputable cloud and infrastructure providers
              selected for their security, scalability, and operational
              resilience. We implement access restrictions, environment
              segregation, logging, and monitoring designed to reduce risk and
              support secure operations.
            </p>
            <p>Core infrastructure protections include:</p>
            <BulletList
              items={[
                "Hardened cloud configurations with environment segregation",
                "Role-based access controls with row-level security on all database tables",
                "TLS 1.3 encryption in transit with HSTS enforcement",
                "AES-256 encryption at rest for database and file storage",
                "Centralized audit logging with IP address and user-agent tracking on every data access",
                "Automated daily backups with point-in-time recovery",
                "Vulnerability scanning and dependency patch management",
              ]}
            />
            <p>
              Where third-party infrastructure providers are used, their
              security responsibilities are paired with Apothecare&apos;s own
              application, access, and operational controls under a shared
              responsibility model.
            </p>
          </Section>

          {/* AI Data Handling */}
          <Section icon={Brain} title="AI Data Handling">
            <p>
              As a clinical AI platform, Apothecare takes special care with how
              patient data is processed by AI providers. Our AI architecture is
              designed with the following safeguards:
            </p>
            <BulletList
              items={[
                "AI providers are selected based on their data handling practices and willingness to execute Business Associate Agreements",
                "Our primary AI provider operates under a zero data retention policy \u2014 patient data sent via the API is never stored, logged, or used for model training",
                "Clinical data is transmitted to AI providers only during active processing and is not persisted on provider infrastructure",
                "AI-generated clinical content includes disclaimers and is always subject to practitioner review before clinical use",
                "Prompt injection detection validates all user inputs before they reach AI providers",
              ]}
            />
          </Section>

          {/* Availability */}
          <Section icon={Activity} title="Availability and Reliability">
            <p>
              Apothecare is designed for dependable performance and ongoing
              service availability. We monitor production systems, investigate
              incidents, and maintain response procedures intended to support
              continuity of service. While no service can guarantee
              uninterrupted operation, we work to reduce downtime risk and
              restore service promptly when issues arise.
            </p>
          </Section>

          {/* Data Protection */}
          <Section icon={Lock} title="Data Protection and Privacy">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-2">
              Customer Data
            </h3>
            <p>
              Apothecare stores and processes customer data in accordance with
              our contractual commitments, internal policies, and applicable law.
              Access to data is limited to authorized personnel with a
              legitimate business need, subject to role-based permissions and
              internal controls.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-6">
              Protected Health Information
            </h3>
            <p>
              If a customer elects to use Apothecare in workflows involving
              protected health information, we apply safeguards intended to
              support the confidentiality, integrity, and availability of that
              information. HIPAA-related use cases require appropriate
              contractual and technical implementation, including a Business
              Associate Agreement where applicable.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-6">
              Encryption
            </h3>
            <p>
              All data transmitted to and from Apothecare is protected using TLS
              1.3 with HTTP Strict Transport Security (HSTS) enforcement. Stored
              data is encrypted at rest using AES-256 encryption via our
              database and storage providers. These measures are intended to
              reduce the risk of unauthorized access to sensitive information
              during transmission and storage.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-6">
              Audit Logging
            </h3>
            <p>
              Every access to protected health information is recorded in an
              immutable audit log capturing the practitioner, action performed,
              resource accessed, IP address, user agent, and timestamp. Export
              events include unique session identifiers and document watermarks
              to support breach investigation and traceability. Audit logs are
              retained for a minimum of six years in accordance with HIPAA
              requirements.
            </p>
          </Section>

          {/* Secure Development */}
          <Section icon={Shield} title="Secure Development and Testing">
            <p>
              Security is incorporated into the software development lifecycle.
              Our security practices include:
            </p>
            <BulletList
              items={[
                "Code review and change controls on all production deployments",
                "Dependency scanning and secret detection in the development pipeline",
                "Input validation with schema enforcement on all API endpoints",
                "Content Security Policy headers and XSS protection on all responses",
                "CSRF origin validation on all mutating endpoints",
                "Environment-specific testing before release",
                "Access logging and anomaly monitoring",
                "Periodic security reviews of architecture and controls",
              ]}
            />
            <p>
              We assess and prioritize remediation of identified vulnerabilities
              based on severity, exploitability, and potential impact.
            </p>
          </Section>

          {/* Governance */}
          <Section icon={FileCheck} title="Security Governance">
            <p>
              Apothecare maintains internal security and operational policies
              covering:
            </p>
            <BulletList
              items={[
                "Access management",
                "Asset and device management",
                "Data protection and retention",
                "Incident response",
                "Vendor and subprocessor oversight",
                "Risk assessment",
                "Secure development practices",
                "Vulnerability management",
                "Workforce training and awareness",
              ]}
            />
            <p>
              These policies are reviewed periodically and updated as needed to
              reflect platform changes, business needs, and legal developments.
            </p>
          </Section>

          {/* Incident Response */}
          <Section icon={AlertTriangle} title="Incident Response and Breach Notification">
            <p>
              Apothecare maintains procedures for identifying, investigating,
              containing, and remediating security incidents. When required by
              applicable law or contract, we provide notice of qualifying
              incidents or breaches within the timelines required under HIPAA,
              the FTC Health Breach Notification Rule, and other applicable
              obligations.
            </p>
          </Section>

          {/* Assessments */}
          <Section icon={FileCheck} title="Independent Assessments">
            <p>
              Apothecare performs internal and external assessments of its
              security controls, which can include vulnerability assessments,
              control testing, and penetration testing. Where Apothecare states
              that it has achieved a certification or completed an independent
              audit, that statement applies only if expressly identified on this
              page or in customer documentation.
            </p>
            <p>
              Apothecare is actively working toward SOC 2 Type II certification
              for the Security trust services criteria. This page will be
              updated when independent assessments are completed.
            </p>
          </Section>

          {/* Responsible Disclosure */}
          <Section icon={Mail} title="Responsible Disclosure">
            <p>
              We take reports of security issues seriously and investigate
              credible submissions in a timely manner.
            </p>
            <p>
              To report a suspected vulnerability, please contact:{" "}
              <a
                href="mailto:security@apothecare.com"
                className="text-[var(--color-brand-600)] hover:underline font-medium"
              >
                security@apothecare.com
              </a>
            </p>
            <p>Please include:</p>
            <BulletList
              items={[
                "A clear description of the issue",
                "Affected URL, feature, or environment",
                "Reproduction steps",
                "Proof of concept, if available",
                "Your contact information for follow-up",
              ]}
            />
            <p>
              We ask researchers to act in good faith, avoid privacy violations
              or service disruption, and allow us reasonable time to investigate
              and remediate before public disclosure.
            </p>
          </Section>

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
