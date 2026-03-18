import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Apothecare Terms of Use governing access to and use of the platform, including AI-generated content disclaimers, HIPAA responsibilities, and subscription terms.",
};

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-3">
        {number}. {title}
      </h2>
      <div className="space-y-4 text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 my-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] mt-2 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-3">
              Terms of Use
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Last Updated: March 18, 2026
            </p>
          </div>

          <div className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed mb-10">
            <p>
              These Terms of Use, together with any documents expressly
              incorporated by reference, including our{" "}
              <Link href="/security" className="text-[var(--color-brand-600)] hover:underline">
                Privacy &amp; Security Policy
              </Link>
              , govern your access to and use of the websites, applications, and
              related products and services made available by Apothecare, Inc.
              and its affiliates, licensors, and service providers
              (collectively, &ldquo;Apothecare,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            </p>
            <p className="mt-4">
              These Terms apply to the Apothecare website, web applications,
              mobile applications, APIs, software, and related content, tools,
              features, communications, and services that link to or reference
              these Terms, which we refer to collectively as the
              &ldquo;Platform&rdquo; or &ldquo;Services.&rdquo;
            </p>
            <p className="mt-4">
              By accessing or using the Services, you agree to be bound by these
              Terms. If you do not agree, do not access or use the Services.
            </p>
          </div>

          <Section number={1} title="Eligibility">
            <p>
              You may use the Services only if you are legally able to enter
              into a binding contract and are not prohibited from using the
              Services under applicable law. If you are using the Services on
              behalf of an organization, you represent and warrant that you have
              authority to bind that organization to these Terms, and
              &ldquo;you&rdquo; includes both you and that organization.
            </p>
            <p>
              The Services may include features intended for licensed healthcare
              professionals, clinical teams, researchers, administrators, or
              enterprise customers. Some features may be restricted based on
              account type, verification status, contractual terms, or
              applicable law.
            </p>
          </Section>

          <Section number={2} title="Nature of the Services">
            <p>
              Apothecare provides software tools and related services that may
              assist users with organizing information, reviewing clinical or
              health-related materials, generating summaries or drafts,
              surfacing operational insights, and supporting workflow
              efficiency.
            </p>
            <p>
              Unless expressly stated otherwise in a separate written agreement,
              the Services are provided for informational, administrative,
              educational, and workflow-support purposes only. The Services do
              not constitute the practice of medicine, nursing, pharmacy, or any
              other licensed profession, and do not create a provider-patient
              relationship between Apothecare and any patient or end user.
            </p>
            <p>
              Any commitments specific to enterprise customers, including
              service levels, implementation obligations, security commitments,
              data processing terms, or HIPAA obligations, will be governed by
              the applicable order form, master services agreement, business
              associate agreement, or other written contract between Apothecare
              and the customer.
            </p>
          </Section>

          <Section number={3} title="No Medical Advice">
            <p>
              Apothecare is not a healthcare provider. Content and outputs made
              available through the Services, including AI-generated outputs,
              summaries, suggestions, extracts, classifications, or draft
              materials, are provided for general informational and
              workflow-support purposes only.
            </p>
            <p>The Services are not intended to:</p>
            <BulletList
              items={[
                "Diagnose, treat, cure, or prevent any disease",
                "Replace independent professional judgment",
                "Establish a standard of care",
                "Substitute for a medical evaluation, clinical assessment, or consultation with a qualified professional",
                "Be relied on as the sole basis for any patient care, prescribing, diagnostic, billing, coding, legal, or compliance decision",
              ]}
            />
            <p>
              You are solely responsible for reviewing and validating any
              information or output before relying on it in a clinical,
              operational, legal, financial, or other professional setting. If
              you are a healthcare professional, you remain solely responsible
              for your professional decisions, documentation, treatment
              recommendations, compliance obligations, and patient
              communications.
            </p>
            <p>
              If you are a consumer or patient, do not rely on the Services as
              medical advice. Always seek the guidance of a qualified healthcare
              professional regarding medical questions or treatment decisions.
              If you believe you are experiencing a medical emergency, call 911
              or your local emergency services immediately.
            </p>
          </Section>

          <Section number={4} title="AI and Automated Features">
            <p>
              Some Services may use machine learning, large language models, or
              other automated systems. These features may generate incomplete,
              outdated, inaccurate, or inappropriate outputs and may not reflect
              all relevant facts, authority, or clinical nuance.
            </p>
            <p>You understand and agree that:</p>
            <BulletList
              items={[
                "AI-generated content may contain errors",
                "Outputs may vary for similar inputs",
                "Outputs are probabilistic and not guaranteed to be correct, complete, or fit for a particular purpose",
                "Automated outputs must be reviewed by an appropriately qualified human before use in any material decision-making",
              ]}
            />
            <p>
              You may not represent AI-generated output as independently
              verified by Apothecare unless Apothecare expressly states
              otherwise.
            </p>
          </Section>

          <Section number={5} title="Accounts and Registration">
            <p>
              To access certain Services, you may need to create an account.
              You agree to provide accurate, current, and complete registration
              information and to keep that information updated.
            </p>
            <p>You are responsible for:</p>
            <BulletList
              items={[
                "Maintaining the confidentiality of your login credentials",
                "All activity that occurs under your account",
                "Promptly notifying us of any unauthorized use of your account or security incident involving your account",
              ]}
            />
            <p>
              We may suspend or terminate accounts that contain false
              information, violate these Terms, create security or legal risk,
              or are otherwise inappropriate for the Services.
            </p>
          </Section>

          <Section number={6} title="Acceptable Use">
            <p>You agree not to, and not to permit others to:</p>
            <BulletList
              items={[
                "Use the Services in violation of any applicable law, regulation, professional standard, or third-party right",
                "Upload, input, or transmit content you do not have the right to use",
                "Use the Services to infringe, misappropriate, or violate intellectual property, privacy, publicity, confidentiality, or other rights",
                "Use the Services to develop or train a competing product or model, except to the extent such restriction is prohibited by law or expressly allowed by written agreement",
                "Reverse engineer, decompile, disassemble, scrape, or otherwise attempt to derive source code, underlying models, prompts, or non-public system components, except as prohibited by law",
                "Access the Services through bots, scrapers, spiders, crawlers, bulk extraction methods, or automated means not authorized by us",
                "Interfere with or disrupt the integrity, security, or performance of the Services",
                "Introduce malware, malicious code, harmful payloads, or unauthorized access methods",
                "Circumvent rate limits, access controls, security protections, or usage restrictions",
                "Use the Services to generate unlawful, fraudulent, harassing, defamatory, discriminatory, or abusive content",
                "Use the Services in a way that could harm patients, consumers, or other individuals",
                "Upload protected health information without an executed Business Associate Agreement and appropriate access controls in place",
              ]}
            />
          </Section>

          <Section number={7} title="Health Information and HIPAA">
            <p>
              Some customers may choose to use the Services in connection with
              protected health information or other regulated health data. Any
              HIPAA-related obligations of Apothecare apply only where:
            </p>
            <BulletList
              items={[
                "The customer is a covered entity or business associate, as applicable",
                "The parties have entered into a valid Business Associate Agreement",
                "The relevant Services are configured and used in a manner permitted under that agreement",
              ]}
            />
            <p>
              You are solely responsible for determining whether your use of the
              Services involves protected health information, patient-identifiable
              data, or other regulated information, and for ensuring that your use
              complies with applicable privacy, security, consent, authorization,
              and recordkeeping requirements.
            </p>
            <p>
              If you submit personal health information, patient data, or other
              regulated information to the Services, you represent and warrant
              that you have all rights, permissions, notices, consents, and
              authorizations necessary to do so.
            </p>
          </Section>

          <Section number={8} title="Privacy and Data Use">
            <p>
              Your use of the Services is also governed by our Privacy Policy,
              which is incorporated into these Terms by reference.
            </p>
            <p>
              To the extent permitted by applicable law and our Privacy Policy,
              we may use data to:
            </p>
            <BulletList
              items={[
                "Operate, maintain, secure, and improve the Services",
                "Provide support and troubleshoot issues",
                "Analyze performance, usage, and trends",
                "Develop product features, models, and functionality",
                "Comply with legal obligations and enforce our rights",
              ]}
            />
            <p>
              We do not sell personal information or protected health
              information. For details on how we handle personal data, including
              rights available to you under applicable state privacy laws (such
              as the California Consumer Privacy Act), please refer to our
              Privacy Policy.
            </p>
            <p>
              We may use aggregated, de-identified, or otherwise
              non-identifiable data for lawful business purposes, provided such
              data does not identify you or any individual patient.
            </p>
            <p>
              You may request deletion of your account and associated data
              through your account settings or by contacting us. Deletion
              requests will be processed in accordance with our Privacy Policy
              and applicable law.
            </p>
          </Section>

          <Section number={9} title="FTC Health Data and Breach Notifications">
            <p>
              Certain health-related products that are not subject to HIPAA may
              still be subject to other laws, including the FTC Health Breach
              Notification Rule. You acknowledge that Apothecare may provide
              notices, disclosures, or workflow limitations that are intended to
              support compliance with applicable privacy and breach-notification
              laws, and you agree to cooperate with reasonable information
              requests relating to security incidents, investigations, or
              required notifications.
            </p>
          </Section>

          <Section number={10} title="Subscription Terms and Billing">
            <p>
              If you purchase a paid subscription or other paid Services, you
              agree to pay all applicable fees, taxes, and charges as described
              at the time of purchase.
            </p>
            <p>Unless otherwise stated:</p>
            <BulletList
              items={[
                "Fees are quoted in U.S. dollars",
                "Subscriptions automatically renew for the renewal term shown at purchase unless canceled",
                "You authorize us and our payment processors to charge your selected payment method for recurring fees and applicable taxes",
                "Fees are non-refundable except as required by law or expressly stated in writing",
              ]}
            />
            <p>
              Apothecare offers a free tier with limited functionality. Features
              available on the free tier may change at any time. Paid
              subscriptions unlock additional capabilities as described on our
              pricing page.
            </p>
            <p>
              You may cancel your subscription through your account settings or
              other cancellation method we make available. Where applicable law
              requires a simple cancellation mechanism for recurring plans, we
              will provide one.
            </p>
            <p>
              We may change pricing, plans, or features at any time. For
              material pricing changes affecting ongoing subscriptions, we will
              provide advance notice where required by law.
            </p>
          </Section>

          <Section number={11} title="User Content">
            <p>
              You may submit prompts, text, files, documents, images, feedback,
              messages, or other materials to the Services, which we refer to as
              &ldquo;User Content.&rdquo;
            </p>
            <p>
              You retain ownership of your User Content, subject to the rights
              you grant below.
            </p>
            <p>
              You grant Apothecare a non-exclusive, worldwide, royalty-free
              license to host, store, process, reproduce, modify, transmit,
              display, and otherwise use your User Content solely as necessary
              to:
            </p>
            <BulletList
              items={[
                "Provide and maintain the Services",
                "Respond to your requests",
                "Improve functionality and safety",
                "Enforce these Terms",
                "Comply with law",
              ]}
            />
            <p>
              If you provide feedback, suggestions, or ideas regarding the
              Services, you grant Apothecare a perpetual, irrevocable,
              royalty-free, transferable, sublicensable license to use them
              without restriction or compensation to you.
            </p>
            <p>
              You are solely responsible for your User Content and the
              consequences of submitting it.
            </p>
          </Section>

          <Section number={12} title="Customer Responsibilities">
            <p>You are responsible for:</p>
            <BulletList
              items={[
                "Reviewing outputs before use",
                "Maintaining your own internal policies and approvals",
                "Ensuring that only authorized personnel access your account and data",
                "Obtaining required patient consents, notices, and authorizations",
                "Using the Services only in jurisdictions and contexts where such use is lawful",
                "Maintaining any records required by professional, regulatory, or contractual obligations",
              ]}
            />
          </Section>

          <Section number={13} title="Third-Party Services">
            <p>
              The Services may integrate with or link to third-party software,
              websites, content, APIs, platforms, devices, or services. We do
              not control and are not responsible for third-party services,
              including their availability, accuracy, security, legality, or
              privacy practices.
            </p>
            <p>
              Your use of third-party services is governed by their own terms
              and policies.
            </p>
          </Section>

          <Section number={14} title="Intellectual Property">
            <p>
              The Services, including all software, models, interfaces, designs,
              workflows, databases, content, trademarks, service marks, logos,
              and other materials made available by Apothecare, are owned by or
              licensed to Apothecare and are protected by intellectual property
              and other laws.
            </p>
            <p>
              Except for the limited rights expressly granted in these Terms, no
              right, title, or interest in the Services is transferred to you.
            </p>
            <p>
              Subject to your compliance with these Terms, Apothecare grants you
              a limited, non-exclusive, non-transferable, non-sublicensable
              right to access and use the Services for your internal lawful use
              during the applicable subscription or access period.
            </p>
          </Section>

          <Section number={15} title="Copyright Complaints">
            <p>
              If you believe any content made available through the Services
              infringes your copyright, please send a notice to:
            </p>
            <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4 my-3 text-sm">
              <p className="font-medium text-[var(--color-text-primary)]">
                Apothecare, Inc.
              </p>
              <p>Attn: Copyright Agent</p>
              <p>
                <a
                  href="mailto:legal@apothecare.com"
                  className="text-[var(--color-brand-600)] hover:underline"
                >
                  legal@apothecare.com
                </a>
              </p>
            </div>
            <p>Your notice should include:</p>
            <BulletList
              items={[
                "Identification of the copyrighted work claimed to be infringed, including a copy or location of an authorized version where possible",
                "Identification of the allegedly infringing material and its location within the Services",
                "Your name, address, telephone number, and email address",
                "A statement of good faith belief that the use is not authorized by the copyright owner, its agent, or the law",
                "A statement, under penalty of perjury, that the information is accurate and that you are authorized to act on behalf of the copyright owner",
                "A physical or electronic signature of the copyright holder or authorized representative",
              ]}
            />
            <p>
              We may remove allegedly infringing material and may terminate the
              account of any user who we determine is a repeat infringer.
            </p>
          </Section>

          <Section number={16} title="Monitoring and Enforcement">
            <p>
              We may, but are not obligated to, monitor use of the Services,
              investigate suspected violations, remove content, restrict access,
              suspend accounts, or take any action we reasonably believe is
              necessary to protect the Services, users, third parties, or our
              legal rights.
            </p>
          </Section>

          <Section number={17} title="Suspension and Termination">
            <p>
              We may suspend or terminate your access to all or part of the
              Services at any time, with or without notice, if:
            </p>
            <BulletList
              items={[
                "You violate these Terms",
                "Your use poses security, legal, or operational risk",
                "Required by law or legal process",
                "We discontinue the relevant Services",
                "Fees remain unpaid",
                "Your account is inactive for an extended period",
                "We suspect fraud, abuse, or unauthorized access",
              ]}
            />
            <p>
              You may stop using the Services at any time. If you cancel a paid
              subscription, the cancellation will take effect at the end of the
              then-current billing period unless otherwise stated.
            </p>
            <p>
              Sections that by their nature should survive termination will
              survive, including ownership, disclaimers, limitations of
              liability, indemnification, payment obligations, dispute
              provisions, and any accrued rights.
            </p>
          </Section>

          <Section number={18} title="Changes to the Services or Terms">
            <p>
              We may update the Services or these Terms from time to time. If we
              make material changes to these Terms, we will post the updated
              version and update the &ldquo;Last Updated&rdquo; date. We may
              also provide additional notice where appropriate.
            </p>
            <p>
              By continuing to use the Services after updated Terms become
              effective, you agree to the revised Terms. If you do not agree,
              you must stop using the Services.
            </p>
          </Section>

          <Section number={19} title="Disclaimers">
            <div className="uppercase text-xs font-semibold tracking-wide text-[var(--color-text-primary)] leading-relaxed space-y-4">
              <p>
                THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
                AVAILABLE.&rdquo; TO THE MAXIMUM EXTENT PERMITTED BY LAW,
                APOTHECARE AND ITS AFFILIATES, LICENSORS, AND SERVICE PROVIDERS
                DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR
                OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR
                A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY,
                COMPLETENESS, RELIABILITY, AVAILABILITY, SECURITY, QUIET
                ENJOYMENT, OR THAT THE SERVICES WILL BE ERROR-FREE OR
                UNINTERRUPTED.
              </p>
              <p>
                WITHOUT LIMITING THE FOREGOING, APOTHECARE DOES NOT WARRANT
                THAT: THE SERVICES OR OUTPUTS WILL BE ACCURATE, COMPLETE,
                CURRENT, OR SUITABLE FOR ANY PARTICULAR USE; THE SERVICES WILL
                PREVENT OR DETECT ALL ERRORS, SECURITY EVENTS, OR COMPLIANCE
                ISSUES; OUTPUTS WILL SATISFY LEGAL, CLINICAL, CODING,
                REIMBURSEMENT, OR DOCUMENTATION REQUIREMENTS; OR THE SERVICES
                WILL BE AVAILABLE WITHOUT INTERRUPTION OR FREE OF HARMFUL
                COMPONENTS.
              </p>
            </div>
          </Section>

          <Section number={20} title="Limitation of Liability">
            <div className="uppercase text-xs font-semibold tracking-wide text-[var(--color-text-primary)] leading-relaxed space-y-4">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, APOTHECARE AND ITS
                AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS,
                LICENSORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR
                PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE,
                GOODWILL, BUSINESS, DATA, OR USE, ARISING OUT OF OR RELATING TO
                THE SERVICES OR THESE TERMS, EVEN IF ADVISED OF THE POSSIBILITY
                OF SUCH DAMAGES.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE TOTAL AGGREGATE
                LIABILITY OF APOTHECARE AND ITS AFFILIATES ARISING OUT OF OR
                RELATING TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE
                GREATER OF: THE AMOUNT YOU PAID TO APOTHECARE FOR THE SERVICES
                GIVING RISE TO THE CLAIM IN THE TWELVE (12) MONTHS BEFORE THE
                EVENT GIVING RISE TO LIABILITY, OR ONE HUNDRED U.S. DOLLARS (US
                $100).
              </p>
              <p>
                SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS OR
                EXCLUSIONS OF LIABILITY, SO SOME OF THE ABOVE MAY NOT APPLY TO
                YOU.
              </p>
            </div>
          </Section>

          <Section number={21} title="Indemnification">
            <p>
              You agree to defend, indemnify, and hold harmless Apothecare and
              its affiliates, officers, directors, employees, contractors,
              licensors, and service providers from and against any claims,
              liabilities, damages, judgments, awards, losses, costs, expenses,
              and fees, including reasonable attorneys&apos; fees, arising out of
              or relating to your access to or use of the Services, your User
              Content, or your violation of these Terms.
            </p>
          </Section>

          <Section number={22} title="Governing Law and Disputes">
            <p>
              These Terms and any dispute arising out of or relating to these
              Terms or the Services will be governed by and construed in
              accordance with the laws of the State of Delaware, without regard
              to its conflict of laws principles.
            </p>
            <p>
              Any legal action or proceeding arising under these Terms will be
              brought exclusively in the federal or state courts located in the
              State of Delaware, and you consent to personal jurisdiction and
              venue in such courts.
            </p>
          </Section>

          <Section number={23} title="Complete Agreement">
            <p>
              Except as expressly provided in a particular legal notice on the
              website, these Terms (including the Privacy Policy and, to the
              extent applicable, any Business Associate Agreement) constitute
              the entire agreement between you and Apothecare with respect to
              your use of the Services.
            </p>
            <p>
              These Terms supersede and replace any and all prior oral or
              written understandings or agreements between Apothecare and you
              regarding the Services.
            </p>
          </Section>

          <Section number={24} title="Assignment">
            <p>
              You may not assign or transfer these Terms, by operation of law or
              otherwise, without our prior written consent. Any attempt by you
              to assign or transfer these Terms without such consent will be
              null and of no effect. We may assign or transfer these Terms, at
              our sole discretion, without restriction. Subject to the
              foregoing, these Terms will bind and inure to the benefit of the
              parties, their successors, and permitted assigns.
            </p>
          </Section>

          <Section number={25} title="Severability">
            <p>
              If any provision of these Terms is held to be invalid, illegal, or
              unenforceable, the remaining provisions will continue in full
              force and effect. The invalid provision will be modified to the
              minimum extent necessary to make it valid and enforceable while
              preserving the original intent.
            </p>
          </Section>

          <Section number={26} title="No Waiver">
            <p>
              Our failure to enforce any right or provision of these Terms will
              not constitute a waiver of future enforcement of that right or
              provision. Except as expressly set forth in these Terms, the
              exercise by either party of any of its remedies under these Terms
              will be without prejudice to its other remedies under these Terms
              or otherwise.
            </p>
          </Section>

          <Section number={27} title="Notices">
            <p>
              Any notices or other communications permitted or required
              hereunder, including those regarding material modifications to
              these Terms, will be in written form and given: (i) by us via
              email to the address associated with your account; or (ii) by
              posting within the Platform. For notices made by email, the date
              of receipt will be deemed the date on which such notice is
              transmitted.
            </p>
          </Section>

          <Section number={28} title="Contact Us">
            <p>
              If you have questions about the Services or these Terms, please
              contact us at{" "}
              <a
                href="mailto:legal@apothecare.com"
                className="text-[var(--color-brand-600)] hover:underline font-medium"
              >
                legal@apothecare.com
              </a>
              .
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
