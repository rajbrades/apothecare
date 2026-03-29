/**
 * Shared symptom definitions for intake form and periodic check-ins.
 * Both the onboarding intake (Section 4) and the check-in page
 * import from here to keep symptom keys and labels consistent.
 */

export interface SymptomDef {
  key: string;
  label: string;
}

export interface SymptomGroup {
  key: string;
  label: string;
  symptoms: SymptomDef[];
}

export const SYMPTOM_GROUPS: SymptomGroup[] = [
  {
    key: "energy",
    label: "Energy & Vitality",
    symptoms: [
      { key: "fatigue", label: "Fatigue / Low energy" },
      { key: "morning_groggy", label: "Morning grogginess / can't wake up" },
      { key: "energy_crash", label: "Energy crashes (especially afternoon)" },
      { key: "exercise_intol", label: "Exercise intolerance / post-exertional malaise" },
    ],
  },
  {
    key: "sleep",
    label: "Sleep",
    symptoms: [
      { key: "sleep_onset", label: "Trouble falling asleep" },
      { key: "sleep_wake", label: "Waking in the night (2-4am)" },
      { key: "sleep_unrefresh", label: "Unrefreshing sleep (tired even after 8hrs)" },
    ],
  },
  {
    key: "gut",
    label: "Gut & Digestion",
    symptoms: [
      { key: "bloating", label: "Bloating / gas after meals" },
      { key: "constipation", label: "Constipation" },
      { key: "diarrhea", label: "Diarrhea / loose stools" },
      { key: "reflux", label: "Acid reflux / GERD / heartburn" },
      { key: "food_sens", label: "Food sensitivities / reactions" },
    ],
  },
  {
    key: "hormonal",
    label: "Hormonal & Metabolic",
    symptoms: [
      { key: "weight", label: "Weight gain (unexplained or resistant to loss)" },
      { key: "cold", label: "Cold hands / feet / temperature sensitivity" },
      { key: "brain_fog", label: "Brain fog / memory / concentration" },
      { key: "libido", label: "Low libido" },
      { key: "mood", label: "Mood instability / irritability / anxiety" },
      { key: "hair_skin", label: "Hair loss / brittle nails / dry skin" },
    ],
  },
];

/** Flat list of all symptom keys */
export const ALL_SYMPTOM_KEYS = SYMPTOM_GROUPS.flatMap((g) =>
  g.symptoms.map((s) => s.key)
);

/** Map from symptom key to its group key */
export const SYMPTOM_TO_GROUP: Record<string, string> = {};
for (const group of SYMPTOM_GROUPS) {
  for (const s of group.symptoms) {
    SYMPTOM_TO_GROUP[s.key] = group.key;
  }
}

/** Map from symptom key to label */
export const SYMPTOM_LABELS: Record<string, string> = {};
for (const group of SYMPTOM_GROUPS) {
  for (const s of group.symptoms) {
    SYMPTOM_LABELS[s.key] = s.label;
  }
}
