import type { LicenseType } from "@/types/database";

// ── License Types ───────────────────────────────────────────────────

export const LICENSE_OPTIONS: { value: LicenseType; label: string; npiRequired: boolean }[] = [
  { value: "md", label: "MD — Doctor of Medicine", npiRequired: true },
  { value: "do", label: "DO — Doctor of Osteopathic Medicine", npiRequired: true },
  { value: "np", label: "NP / APRN — Nurse Practitioner", npiRequired: true },
  { value: "pa", label: "PA-C — Physician Assistant", npiRequired: true },
  { value: "dc", label: "DC — Doctor of Chiropractic", npiRequired: false },
  { value: "nd", label: "ND — Naturopathic Doctor", npiRequired: false },
  { value: "lac", label: "LAc — Licensed Acupuncturist", npiRequired: false },
  { value: "other", label: "Other Healthcare Professional", npiRequired: false },
];

// ── NPI Validation ──────────────────────────────────────────────────

/**
 * Validates an NPI (National Provider Identifier) using the Luhn mod 10
 * check digit algorithm. Per CMS specification, the NPI is validated by
 * prepending the constant "80840" to the 10-digit NPI, then running the
 * standard Luhn check on the resulting 15-digit string.
 */
export function validateNpi(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) return false;

  const digits = ("80840" + npi).split("").map(Number);
  let sum = 0;

  for (let i = digits.length - 1; i >= 0; i--) {
    const distFromRight = digits.length - 1 - i;
    let d = digits[i];
    if (distFromRight % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }

  return sum % 10 === 0;
}

// ── US States ───────────────────────────────────────────────────────

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "AS", label: "American Samoa" },
  { value: "GU", label: "Guam" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "PR", label: "Puerto Rico" },
  { value: "VI", label: "U.S. Virgin Islands" },
] as const;

// ── Clinical Specialties ────────────────────────────────────────────

export const SPECIALTY_OPTIONS = [
  "Hormone Optimization",
  "GI / Gut Health",
  "Metabolic / Weight Management",
  "Thyroid / Autoimmune",
  "Mental Health / Neurology",
  "Detox / Environmental Medicine",
  "Anti-Aging / Longevity",
  "Pain Management",
  "Pediatrics",
  "Women's Health",
  "Men's Health",
  "General Functional Medicine",
] as const;

// ── Note Templates ──────────────────────────────────────────────────

export const NOTE_TEMPLATE_OPTIONS = [
  { value: "soap", label: "SOAP Note" },
  { value: "history_physical", label: "History & Physical" },
  { value: "consult", label: "Consultation" },
  { value: "follow_up", label: "Follow-Up" },
] as const;
