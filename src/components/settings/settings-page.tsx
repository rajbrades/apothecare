"use client";

import { useRef, useState, useEffect } from "react";
import {
  User,
  Award,
  Palette,
  SlidersHorizontal,
  CreditCard,
  Shield,
  ChevronDown,
} from "lucide-react";
import type { Practitioner } from "@/types/database";
import { ProfileSection } from "./profile-section";
import { CredentialsSection } from "./credentials-section";
import { PreferencesSection } from "./preferences-section";
import { BiomarkerOverridesSection } from "./biomarker-overrides-section";
import { SubscriptionSection } from "./subscription-section";
import { BrandingSection } from "./branding-section";
import { AccountSection } from "./account-section";

interface BrandPref {
  id: string;
  brand_name: string;
  priority: number;
  is_active: boolean;
}

interface SettingsPageProps {
  practitioner: Practitioner;
  initialBrands: BrandPref[];
  initialStrictMode: boolean;
  userEmail: string;
  authProvider: string;
}

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "credentials", label: "Practice & Credentials", icon: Award },
  { id: "branding", label: "Practice Branding", icon: Palette },
  { id: "preferences", label: "Clinical Preferences", icon: SlidersHorizontal },
  { id: "subscription", label: "Subscription & Usage", icon: CreditCard },
  { id: "account", label: "Account & Security", icon: Shield },
] as const;

type Section = (typeof SECTIONS)[number];

function MobileSectionPicker({
  sections,
  activeSection,
  onSelect,
}: {
  sections: readonly Section[];
  activeSection: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = sections.find((s) => s.id === activeSection) ?? sections[0];
  const ActiveIcon = active.icon;

  return (
    <div className="md:hidden relative mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-primary)]"
      >
        <span className="flex items-center gap-2.5">
          <ActiveIcon className="w-4 h-4 text-[var(--color-brand-600)]" />
          {active.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-elevated)] overflow-hidden">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { onSelect(id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors border-b border-[var(--color-border-light)] last:border-0 ${
                id === activeSection
                  ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsPage({
  practitioner,
  initialBrands,
  initialStrictMode,
  userEmail,
  authProvider,
}: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState("profile");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-20% 0px -70% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-16">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
        Settings
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        Manage your profile, credentials, and clinical preferences.
      </p>

      {/* Mobile section picker dropdown */}
      <MobileSectionPicker
        sections={SECTIONS}
        activeSection={activeSection}
        onSelect={scrollTo}
      />

      <div className="flex gap-8 mt-8">
        {/* Left nav — desktop only */}
        <nav className="hidden md:flex flex-col w-52 flex-shrink-0 sticky top-6 self-start gap-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-[var(--radius-sm)] transition-colors text-left ${
                activeSection === id
                  ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-8">
          <div ref={(el) => { sectionRefs.current.profile = el; }}>
            <ProfileSection practitioner={practitioner} />
          </div>
          <div ref={(el) => { sectionRefs.current.credentials = el; }}>
            <CredentialsSection practitioner={practitioner} />
          </div>
          <div ref={(el) => { sectionRefs.current.branding = el; }}>
            <BrandingSection practitioner={practitioner} />
          </div>
          <div ref={(el) => { sectionRefs.current.preferences = el; }}>
            <PreferencesSection
              practitioner={practitioner}
              initialBrands={initialBrands}
              initialStrictMode={initialStrictMode}
            />
            <BiomarkerOverridesSection />
          </div>
          <div ref={(el) => { sectionRefs.current.subscription = el; }}>
            <SubscriptionSection practitioner={practitioner} />
          </div>
          <div ref={(el) => { sectionRefs.current.account = el; }}>
            <AccountSection
              practitioner={practitioner}
              userEmail={userEmail}
              authProvider={authProvider}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
