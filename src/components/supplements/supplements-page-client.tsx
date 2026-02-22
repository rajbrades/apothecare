"use client";

import { useState } from "react";
import { ClipboardList, Shield, Package } from "lucide-react";
import { ReviewTab } from "./review-tab";
import { InteractionChecker } from "./interaction-checker";
import { BrandFormulary } from "./brand-formulary";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  supplements: string | null;
  current_medications: string | null;
}

interface ReviewItem {
  id: string;
  patient_id: string | null;
  status: string;
  review_data: any;
  created_at: string;
  patients: { first_name: string | null; last_name: string | null } | null;
}

interface SupplementsPageClientProps {
  initialReviews: ReviewItem[];
  patients: PatientOption[];
}

type Tab = "reviews" | "interactions" | "brands";

const tabs: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
  { id: "reviews", label: "Reviews", icon: ClipboardList },
  { id: "interactions", label: "Interaction Checker", icon: Shield },
  { id: "brands", label: "Brand Formulary", icon: Package },
];

export function SupplementsPageClient({
  initialReviews,
  patients,
}: SupplementsPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("reviews");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  return (
    <div>
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Supplement sections"
        className="flex gap-1 mb-6 border-b border-[var(--color-border-light)]"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-[var(--color-brand-500)] text-[var(--color-brand-700)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <tab.icon className="w-4 h-4" strokeWidth={1.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "reviews" && (
          <ReviewTab
            patients={patients}
            initialReviews={initialReviews}
            selectedPatientId={selectedPatientId}
            onPatientChange={setSelectedPatientId}
          />
        )}
        {activeTab === "interactions" && (
          <InteractionChecker
            patients={patients}
            selectedPatientId={selectedPatientId}
            onPatientChange={setSelectedPatientId}
          />
        )}
        {activeTab === "brands" && <BrandFormulary />}
      </div>
    </div>
  );
}

// Re-export types used by child components
export type { PatientOption, ReviewItem };
