"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Logomark } from "@/components/ui/logomark";
import {
  TextField, TextAreaField, SelectField, CheckboxGrid, RadioGroup,
  SliderField, DynamicRows, FieldRow, Subsection, InfoBox, SectionCard,
} from "./intake-fields";

const SECTIONS = [
  "About You",
  "Medical History",
  "Family History",
  "Symptoms",
  "Lifestyle",
  "Supplements",
] as const;

interface PrefillData {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  sex?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  gender_identity?: string;
  ethnicity?: string;
  referral_source?: string;
  auth_email?: string;
}

interface FunctionalMedicineIntakeProps {
  templateId: string;
  prefill?: PrefillData;
  onComplete: () => void;
}

export function FunctionalMedicineIntake({ templateId, prefill, onComplete }: FunctionalMedicineIntakeProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────
  const [r, setR] = useState<Record<string, any>>({
    // Section 1
    first_name: prefill?.first_name || "",
    last_name: prefill?.last_name || "",
    dob: prefill?.date_of_birth || "",
    bio_sex: prefill?.sex || "",
    gender_identity: prefill?.gender_identity || "",
    email: prefill?.auth_email || prefill?.email || "",
    phone: prefill?.phone || "",
    address: "",
    city: prefill?.city || "",
    state: prefill?.state || "",
    zip: prefill?.zip_code || "",
    ethnicity: prefill?.ethnicity || "",
    referral: prefill?.referral_source || "",
    reason_for_visit: "",
    // Section 2
    diagnoses: [] as string[], diagnoses_detail: "",
    surgeries: [["", ""]], hospitalizations: [["", ""]],
    medications: [["", "", ""]], allergies_list: [["", ""]],
    // Section 3
    family_conditions: [] as string[], family_detail: "",
    genetic_testing: "", apoe: "", mthfr: "",
    // Section 4
    sym_fatigue: 0, sym_morning_groggy: 0, sym_energy_crash: 0, sym_exercise_intol: 0,
    sym_sleep_onset: 0, sym_sleep_wake: 0, sym_sleep_unrefresh: 0,
    sleep_hours: "", sleep_bedtime: "",
    sym_bloating: 0, sym_constipation: 0, sym_diarrhea: 0, sym_reflux: 0, sym_food_sens: 0,
    food_triggers: "",
    sym_weight: 0, sym_cold: 0, sym_brain_fog: 0, sym_libido: 0, sym_mood: 0, sym_hair_skin: 0,
    top_3_symptoms: "",
    // Section 5
    diet_type: "", meals_per_day: "", skip_breakfast: "", typical_day_eating: "",
    sugar_intake: 5, water_intake: "",
    exercise_freq: "", exercise_type: "", exercise_tolerance: "",
    stress_level: 5, stressors: [] as string[], stress_management: "",
    alcohol: "", caffeine: "", tobacco: "", cannabis: "", other_substances: "",
    env_exposures: [] as string[], env_detail: "",
    // Section 6
    supplements: [["", "", "", ""]], past_supplements: "", preferred_brands: "",
    supplement_budget: "",
    prior_labs: [] as string[],
    health_goals: "", anything_else: "",
  });

  const set = useCallback((key: string, value: any) => {
    setR((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────
  const goTo = (idx: number) => {
    setCurrent(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => current < SECTIONS.length - 1 && goTo(current + 1);
  const back = () => current > 0 && goTo(current - 1);

  // ── Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/patient-portal/me/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, responses: r }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit intake");
        return;
      }
      setSubmitted(true);
      setTimeout(() => onComplete(), 2000);
    } catch {
      toast.error("Failed to submit. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Thank you screen ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16 animate-in fade-in">
        <div className="w-[72px] h-[72px] rounded-full bg-[var(--color-brand-50)] border-2 border-[var(--color-brand-200)] flex items-center justify-center mb-7">
          <CheckCircle2 className="w-8 h-8 text-[var(--color-brand-600)]" />
        </div>
        <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] italic mb-3">
          Thank you for sharing.
        </h2>
        <p className="text-[15px] text-[var(--color-text-muted)] max-w-[420px] leading-relaxed">
          Your intake has been received. Your practitioner will review your full health history before your visit so you can spend your time together on insight — not paperwork.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-[var(--font-display)]">
          New Patient Health Intake
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5 max-w-[480px] mx-auto leading-relaxed">
          This questionnaire helps your practitioner understand the full picture of your health — not just your symptoms, but the story behind them.
        </p>
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
          <Clock className="w-3 h-3 text-[var(--color-text-muted)]" />
          <span className="text-[11px] text-[var(--color-text-muted)]">
            15–20 minutes · HIPAA-protected
          </span>
        </div>
      </div>

      {/* Sticky progress */}
      <div className="sticky top-0 z-40 -mx-6 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-0 px-4 overflow-x-auto scrollbar-hide touch-pan-x">
          {SECTIONS.map((name, i) => (
            <div key={name} className="flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                className="flex flex-col items-center py-3 px-1"
              >
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-medium mb-1 transition-all ${
                  i === current
                    ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)] text-white"
                    : i < current
                    ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)] text-[var(--color-brand-600)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                }`}>
                  {i < current ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-wide whitespace-nowrap transition-colors ${
                  i === current ? "text-[var(--color-brand-600)]" : "text-[var(--color-text-muted)]"
                }`}>
                  {name}
                </span>
              </button>
              {i < SECTIONS.length - 1 && (
                <div className={`w-6 sm:w-8 h-0.5 mb-4 flex-shrink-0 transition-colors ${
                  i < current ? "bg-[var(--color-brand-300)]" : "bg-[var(--color-border)]"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {/* ── SECTION 1: ABOUT YOU ── */}
        {current === 0 && (
          <SectionCard num={1} total={6} title="About You" why="Basic demographics help us contextualize everything else — age influences hormone patterns, biological sex affects reference ranges, and your contact details ensure your practitioner can reach you.">
            <FieldRow><TextField label="First Name" placeholder="Jane" value={r.first_name} onChange={(v) => set("first_name", v)} /><TextField label="Last Name" placeholder="Smith" value={r.last_name} onChange={(v) => set("last_name", v)} /></FieldRow>
            <FieldRow cols={3}><TextField label="Date of Birth" type="date" value={r.dob} onChange={(v) => set("dob", v)} /><SelectField label="Biological Sex" value={r.bio_sex} onChange={(v) => set("bio_sex", v)} options={[{value:"female",label:"Female"},{value:"male",label:"Male"},{value:"intersex",label:"Intersex"},{value:"pnts",label:"Prefer not to say"}]} /><TextField label="Gender Identity" placeholder="Optional" value={r.gender_identity} onChange={(v) => set("gender_identity", v)} optional /></FieldRow>
            <FieldRow><TextField label="Email Address" type="email" placeholder="jane@email.com" value={r.email} onChange={(v) => set("email", v)} readOnly={!!prefill?.auth_email} /><TextField label="Phone Number" type="tel" placeholder="(305) 000-0000" value={r.phone} onChange={(v) => set("phone", v)} /></FieldRow>
            <TextField label="Address" placeholder="1919 NE 45th St" value={r.address} onChange={(v) => set("address", v)} />
            <FieldRow cols={3}><TextField label="City" placeholder="Miami" value={r.city} onChange={(v) => set("city", v)} /><TextField label="State" placeholder="FL" value={r.state} onChange={(v) => set("state", v)} /><TextField label="Zip Code" placeholder="33101" value={r.zip} onChange={(v) => set("zip", v)} /></FieldRow>
            <FieldRow>
              <TextField label="Ethnicity / Ancestry" placeholder="e.g. Ashkenazi Jewish, West African, Northern European..." value={r.ethnicity} onChange={(v) => set("ethnicity", v)} hint="Genetic ancestry can influence lab reference ranges and certain health predispositions." optional />
              <SelectField label="How did you hear about us?" value={r.referral} onChange={(v) => set("referral", v)} topAligned options={[{value:"practitioner",label:"Referred by practitioner"},{value:"friend",label:"Referred by friend/family"},{value:"social",label:"Social media"},{value:"search",label:"Search engine"},{value:"podcast",label:"Podcast/media"},{value:"conference",label:"Conference/event"},{value:"other",label:"Other"}]} />
            </FieldRow>
            <TextAreaField label="Primary Reason for Visit" hint="In your own words — what brings you here today?" placeholder="e.g. I've had chronic fatigue for 3 years. I've been to many conventional doctors and haven't found answers..." value={r.reason_for_visit} onChange={(v) => set("reason_for_visit", v)} />
          </SectionCard>
        )}

        {/* ── SECTION 2: MEDICAL HISTORY ── */}
        {current === 1 && (
          <SectionCard num={2} total={6} title="Medical History" why="Functional medicine practitioners look for connections across your entire health timeline — a diagnosis from 10 years ago may be directly linked to what you're experiencing today.">
            <InfoBox>Be as complete as possible — even conditions that feel &ldquo;minor&rdquo; or &ldquo;resolved&rdquo; can be relevant to your current health.</InfoBox>
            <Subsection title="Current & Past Diagnoses" desc="Select all that apply — past or present" />
            <CheckboxGrid options={["Thyroid disorder (hypo/hyper/Hashimoto's)","Adrenal dysfunction / fatigue","Diabetes / Pre-diabetes / Insulin resistance","Cardiovascular disease / hypertension","Autoimmune condition","IBS / IBD / Crohn's / Colitis","SIBO / Dysbiosis / Leaky Gut","PCOS / Hormonal imbalance","Endometriosis / Fibroids","Chronic fatigue syndrome / ME-CFS","Fibromyalgia","Lyme disease / Tick-borne illness","Mold / Mycotoxin illness (CIRS)","Long COVID / Post-viral syndrome","Cancer (past or present)","Neurological condition (MS, Parkinson's, etc.)","Anxiety / Panic disorder","Depression","ADHD / ADD","Osteoporosis / Osteopenia","Chronic pain condition","Sleep apnea"]} selected={r.diagnoses} onChange={(v) => set("diagnoses", v)} />
            <TextAreaField label="Additional diagnoses or details" placeholder="Any other past or current conditions, or additional detail on items above..." value={r.diagnoses_detail} onChange={(v) => set("diagnoses_detail", v)} />
            <Subsection title="Surgeries & Major Procedures" />
            <DynamicRows label="" fields={[{placeholder:"Procedure / Surgery name"},{placeholder:"Approx. year",width:"120px"}]} rows={r.surgeries} onChange={(v) => set("surgeries", v)} addLabel="Add Surgery / Procedure" />
            <Subsection title="Hospitalizations" />
            <DynamicRows label="" fields={[{placeholder:"Reason for hospitalization"},{placeholder:"Approx. year",width:"120px"}]} rows={r.hospitalizations} onChange={(v) => set("hospitalizations", v)} addLabel="Add Hospitalization" />
            <Subsection title="Current Prescription Medications" desc="Include dose and how long you've been taking it" />
            <DynamicRows label="" fields={[{placeholder:"Medication name",autocomplete:{type:"medication"}},{placeholder:"Dose (e.g. 50mg)",width:"130px"},{placeholder:"How long?",width:"130px"}]} rows={r.medications} onChange={(v) => set("medications", v)} addLabel="Add Medication" />
            <Subsection title="Allergies & Sensitivities" />
            <DynamicRows label="" fields={[{placeholder:"Allergen (food, medication, environmental)",autocomplete:{type:"allergen"}},{placeholder:"Reaction"}]} rows={r.allergies_list} onChange={(v) => set("allergies_list", v)} addLabel="Add Allergy / Sensitivity" />
          </SectionCard>
        )}

        {/* ── SECTION 3: FAMILY HISTORY ── */}
        {current === 2 && (
          <SectionCard num={3} total={6} title="Family History" why="Your genetic inheritance shapes your predispositions — but it's not destiny. Knowing your family's patterns helps us understand which systems to monitor closely and prioritize in your protocol.">
            <CheckboxGrid label="Family History of Conditions" hint="Check all that apply in your immediate family (parents, siblings, grandparents)" options={["Heart disease / Heart attack","Stroke","Type 2 Diabetes","Alzheimer's / Dementia","Cancer (specify below)","Autoimmune disease","Thyroid disease","Mental health conditions","Osteoporosis","Obesity / Metabolic syndrome","Addiction / Substance use","Longevity (family members 90+)"]} selected={r.family_conditions} onChange={(v) => set("family_conditions", v)} />
            <TextAreaField label="Details / Additional family history" hint="Which family member had the condition? At what age? Any patterns across generations?" placeholder="e.g. Mother diagnosed with Hashimoto's at 42. Father had a heart attack at 58..." value={r.family_detail} onChange={(v) => set("family_detail", v)} />
            <Subsection title="APOE / Genetic Testing" desc="Optional — but very helpful for cardiovascular and cognitive risk profiling" />
            <FieldRow><SelectField label="Have you done genetic testing?" value={r.genetic_testing} onChange={(v) => set("genetic_testing", v)} options={[{value:"yes",label:"Yes"},{value:"no",label:"No"},{value:"yes_raw",label:"Yes — and I have my raw data"}]} /><SelectField label="Do you know your APOE genotype?" value={r.apoe} onChange={(v) => set("apoe", v)} options={[{value:"2/2",label:"APOE 2/2"},{value:"2/3",label:"APOE 2/3"},{value:"3/3",label:"APOE 3/3 (most common)"},{value:"3/4",label:"APOE 3/4"},{value:"4/4",label:"APOE 4/4"},{value:"unknown",label:"Don't know"}]} /></FieldRow>
            <TextField label="MTHFR or other genetic variants known" placeholder="e.g. MTHFR C677T heterozygous, COMT Val/Val..." value={r.mthfr} onChange={(v) => set("mthfr", v)} />
          </SectionCard>
        )}

        {/* ── SECTION 4: SYMPTOMS ── */}
        {current === 3 && (
          <SectionCard num={4} total={6} title="Symptoms & Functional Health" why="Functional medicine maps symptoms across body systems — what looks like a dozen separate complaints often traces back to 1–2 root causes. Rating your symptoms helps prioritize and track change over time.">
            <InfoBox>Rate each symptom from 0 (never / not a problem) to 10 (severe / constant). Only fill in what&apos;s relevant to you.</InfoBox>
            <Subsection title="Energy & Vitality" />
            <SliderField label="Fatigue / Low energy" value={r.sym_fatigue} onChange={(v) => set("sym_fatigue", v)} />
            <SliderField label="Morning grogginess / can't wake up" value={r.sym_morning_groggy} onChange={(v) => set("sym_morning_groggy", v)} />
            <SliderField label="Energy crashes (especially afternoon)" value={r.sym_energy_crash} onChange={(v) => set("sym_energy_crash", v)} />
            <SliderField label="Exercise intolerance / post-exertional malaise" value={r.sym_exercise_intol} onChange={(v) => set("sym_exercise_intol", v)} />
            <Subsection title="Sleep" />
            <SliderField label="Trouble falling asleep" value={r.sym_sleep_onset} onChange={(v) => set("sym_sleep_onset", v)} />
            <SliderField label="Waking in the night (2–4am)" value={r.sym_sleep_wake} onChange={(v) => set("sym_sleep_wake", v)} />
            <SliderField label="Unrefreshing sleep (tired even after 8hrs)" value={r.sym_sleep_unrefresh} onChange={(v) => set("sym_sleep_unrefresh", v)} />
            <FieldRow><TextField label="Average hours of sleep per night" type="number" placeholder="e.g. 7" value={r.sleep_hours} onChange={(v) => set("sleep_hours", v)} /><TextField label="Typical bedtime" placeholder="e.g. 11pm" value={r.sleep_bedtime} onChange={(v) => set("sleep_bedtime", v)} /></FieldRow>
            <Subsection title="Gut & Digestion" />
            <SliderField label="Bloating / gas after meals" value={r.sym_bloating} onChange={(v) => set("sym_bloating", v)} />
            <SliderField label="Constipation" value={r.sym_constipation} onChange={(v) => set("sym_constipation", v)} />
            <SliderField label="Diarrhea / loose stools" value={r.sym_diarrhea} onChange={(v) => set("sym_diarrhea", v)} />
            <SliderField label="Acid reflux / GERD / heartburn" value={r.sym_reflux} onChange={(v) => set("sym_reflux", v)} />
            <SliderField label="Food sensitivities / reactions" value={r.sym_food_sens} onChange={(v) => set("sym_food_sens", v)} />
            <TextField label="Known food triggers" placeholder="e.g. gluten, dairy, eggs, nightshades, FODMAPs..." value={r.food_triggers} onChange={(v) => set("food_triggers", v)} />
            <Subsection title="Hormonal & Metabolic" />
            <SliderField label="Weight gain (unexplained or resistant to loss)" value={r.sym_weight} onChange={(v) => set("sym_weight", v)} />
            <SliderField label="Cold hands / feet / temperature sensitivity" value={r.sym_cold} onChange={(v) => set("sym_cold", v)} />
            <SliderField label="Brain fog / memory / concentration" value={r.sym_brain_fog} onChange={(v) => set("sym_brain_fog", v)} />
            <SliderField label="Low libido" value={r.sym_libido} onChange={(v) => set("sym_libido", v)} />
            <SliderField label="Mood instability / irritability / anxiety" value={r.sym_mood} onChange={(v) => set("sym_mood", v)} />
            <SliderField label="Hair loss / brittle nails / dry skin" value={r.sym_hair_skin} onChange={(v) => set("sym_hair_skin", v)} />
            <TextAreaField label="Top 3 symptoms you most want to resolve" placeholder="e.g. 1. Fatigue that starts by noon. 2. Bloating after every meal. 3. Waking at 3am every night..." value={r.top_3_symptoms} onChange={(v) => set("top_3_symptoms", v)} />
          </SectionCard>
        )}

        {/* ── SECTION 5: LIFESTYLE ── */}
        {current === 4 && (
          <SectionCard num={5} total={6} title="Lifestyle & Environment" why="In functional medicine, lifestyle IS medicine. Diet, movement, stress, sleep hygiene, and toxic exposures are often the primary drivers of chronic disease — and the primary levers for healing.">
            <Subsection title="Diet & Nutrition" />
            <RadioGroup label="Current dietary approach" value={r.diet_type} onChange={(v) => set("diet_type", v)} options={["Standard American Diet","Mediterranean","Paleo / Ancestral","Ketogenic / Low-carb","Plant-based / Vegan","Gluten-free","Carnivore","Other / Mixed"]} />
            <FieldRow><SelectField label="Meals per day (avg)" value={r.meals_per_day} onChange={(v) => set("meals_per_day", v)} options={[{value:"1",label:"1"},{value:"2",label:"2"},{value:"3",label:"3"},{value:"4+",label:"4+"},{value:"irregular",label:"Irregular"}]} /><SelectField label="Do you skip breakfast?" value={r.skip_breakfast} onChange={(v) => set("skip_breakfast", v)} options={[{value:"never",label:"Never"},{value:"sometimes",label:"Sometimes"},{value:"if_daily",label:"Daily (intentional IF)"},{value:"not_hungry",label:"Daily (not hungry)"}]} /></FieldRow>
            <TextAreaField label="Describe a typical day of eating" placeholder="e.g. Breakfast: black coffee + eggs. Lunch: salad with chicken..." value={r.typical_day_eating} onChange={(v) => set("typical_day_eating", v)} />
            <SliderField label="Sugar / processed food intake" value={r.sugar_intake} onChange={(v) => set("sugar_intake", v)} lowLabel="Very low" highLabel="Very high" />
            <TextField label="Water intake (oz per day)" placeholder="e.g. ~64 oz / 8 cups" value={r.water_intake} onChange={(v) => set("water_intake", v)} />
            <Subsection title="Movement & Exercise" />
            <FieldRow><SelectField label="Exercise frequency (days/week)" value={r.exercise_freq} onChange={(v) => set("exercise_freq", v)} options={[{value:"0",label:"0 — sedentary"},{value:"1-2",label:"1–2 days/week"},{value:"3-4",label:"3–4 days/week"},{value:"5+",label:"5+ days/week"}]} /><SelectField label="Primary type of exercise" value={r.exercise_type} onChange={(v) => set("exercise_type", v)} options={[{value:"strength",label:"Strength training"},{value:"cardio",label:"Cardio / running"},{value:"yoga",label:"Yoga / Pilates"},{value:"hiit",label:"HIIT"},{value:"walking",label:"Walking"},{value:"mixed",label:"Mixed"},{value:"none",label:"None"}]} /></FieldRow>
            <RadioGroup label="Exercise tolerance" value={r.exercise_tolerance} onChange={(v) => set("exercise_tolerance", v)} options={["I feel energized after exercise","I feel drained / worse after exercise","I recover well but need rest days","I avoid exercise due to symptoms"]} />
            <Subsection title="Stress & Nervous System" />
            <SliderField label="Current overall stress level" value={r.stress_level} onChange={(v) => set("stress_level", v)} lowLabel="Very low" highLabel="Extreme" />
            <CheckboxGrid label="Primary stressors" options={["Work / career","Financial","Relationship / family","Health / illness","Caregiver role","Grief / loss","Social isolation","Purpose / meaning"]} selected={r.stressors} onChange={(v) => set("stressors", v)} />
            <TextField label="Current stress management practices" placeholder="e.g. meditation, therapy, journaling, breathwork..." value={r.stress_management} onChange={(v) => set("stress_management", v)} />
            <Subsection title="Substance Use" desc="Confidential — this helps us assess inflammatory load and detoxification demand" />
            <FieldRow><SelectField label="Alcohol" value={r.alcohol} onChange={(v) => set("alcohol", v)} options={[{value:"never",label:"Never"},{value:"rarely",label:"Rarely (special occasions)"},{value:"social",label:"Socially (1–3 drinks/week)"},{value:"moderate",label:"Moderately (4–7 drinks/week)"},{value:"daily",label:"Daily"},{value:"past",label:"Past use only"}]} /><SelectField label="Caffeine" value={r.caffeine} onChange={(v) => set("caffeine", v)} options={[{value:"none",label:"None"},{value:"1",label:"1 cup/day"},{value:"2-3",label:"2–3 cups/day"},{value:"4+",label:"4+ cups/day"}]} /></FieldRow>
            <FieldRow><SelectField label="Tobacco / Nicotine" value={r.tobacco} onChange={(v) => set("tobacco", v)} options={[{value:"never",label:"Never"},{value:"current",label:"Current smoker"},{value:"former",label:"Former smoker"},{value:"vape",label:"Vape / e-cigarette"},{value:"occasional",label:"Occasional"}]} /><SelectField label="Cannabis" value={r.cannabis} onChange={(v) => set("cannabis", v)} options={[{value:"never",label:"Never"},{value:"occasional",label:"Occasional"},{value:"regular",label:"Regular (multiple times/week)"},{value:"daily",label:"Daily"},{value:"past",label:"Past use only"}]} /></FieldRow>
            <TextField label="Other substance use (past or present)" placeholder="Optional — this is confidential and relevant to detox and liver function..." value={r.other_substances} onChange={(v) => set("other_substances", v)} optional />
            <Subsection title="Environmental Exposures" desc="Toxin burden is a significant driver of chronic illness — often overlooked in conventional care" />
            <CheckboxGrid options={["Known or suspected mold exposure","Heavy metal exposure (occupational/dental)","Pesticide / chemical exposure","Live / work near industrial sites","Use conventional cleaning products","Use conventional personal care products","Non-filtered tap water at home","Symptoms worsen in certain buildings"]} selected={r.env_exposures} onChange={(v) => set("env_exposures", v)} />
            <TextAreaField label="Additional environmental details" placeholder="e.g. Water-damaged building at work, amalgam fillings removed 5 years ago..." value={r.env_detail} onChange={(v) => set("env_detail", v)} />
          </SectionCard>
        )}

        {/* ── SECTION 6: SUPPLEMENTS ── */}
        {current === 5 && (
          <SectionCard num={6} total={6} title="Supplements & Current Protocols" why="Supplements can interact with each other and with medications — and more is not always better. A complete picture lets us identify gaps, duplications, and opportunities for a safer, more targeted protocol.">
            <InfoBox>Include everything — vitamins, minerals, herbs, protein powders, adaptogens, hormones (DHEA, melatonin), peptides, and any other health products.</InfoBox>
            <Subsection title="Current Supplements" />
            <DynamicRows label="" fields={[{placeholder:"Brand (e.g. Pure Encapsulations)",autocomplete:{type:"supplement_brand"},width:"200px"},{placeholder:"Name (e.g. Magnesium Glycinate)",autocomplete:{type:"supplement"}},{placeholder:"Dose (e.g. 400mg)",width:"120px"},{placeholder:"Frequency (e.g. nightly)",width:"140px"}]} rows={r.supplements} onChange={(v) => set("supplements", v)} addLabel="Add Supplement" />
            <Subsection title="Supplement History & Preferences" />
            <TextAreaField label="Past supplements you've tried and stopped" hint="Why did you stop? Did they help? Did they cause reactions?" placeholder="e.g. Tried Ashwagandha for 3 months — felt more anxious..." value={r.past_supplements} onChange={(v) => set("past_supplements", v)} />
            <TextField label="Brands you prefer or trust" placeholder="e.g. Designs for Health, Thorne, Metagenics..." value={r.preferred_brands} onChange={(v) => set("preferred_brands", v)} />
            <SelectField label="Budget for supplements per month" value={r.supplement_budget} onChange={(v) => set("supplement_budget", v)} options={[{value:"<50",label:"Under $50/mo"},{value:"50-100",label:"$50–100/mo"},{value:"100-200",label:"$100–200/mo"},{value:"200-400",label:"$200–400/mo"},{value:"400+",label:"$400+/mo"},{value:"none",label:"No budget constraint"}]} />
            <Subsection title="Prior Lab Work" />
            <CheckboxGrid label="Have you had any functional or specialty labs done?" options={["Comprehensive metabolic panel (CMP)","Full thyroid panel (TSH, T3, T4, antibodies)","Hormone panel (cortisol, DHEA, sex hormones)","GI-MAP / stool testing","Organic acids test (OAT)","Micronutrient / nutritional testing","Heavy metals testing","Food sensitivity (IgG) testing","Genetic / MTHFR testing","Cardiovascular markers (ApoB, hsCRP, Lp(a))"]} selected={r.prior_labs} onChange={(v) => set("prior_labs", v)} />
            <TextAreaField label="What are your top health goals for the next 6 months?" placeholder="e.g. Eliminate fatigue so I can be present with my family. Lose 20 lbs without losing muscle..." value={r.health_goals} onChange={(v) => set("health_goals", v)} />
            <TextAreaField label="Anything else your practitioner should know?" placeholder="Anything we haven't covered — life circumstances, past trauma, things you've been afraid to bring up..." value={r.anything_else} onChange={(v) => set("anything_else", v)} />
          </SectionCard>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          {current > 0 ? (
            <button type="button" onClick={back} className="px-6 py-3 text-sm font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
              ← Back
            </button>
          ) : <span />}
          {current < SECTIONS.length - 1 ? (
            <button type="button" onClick={next} className="px-8 py-3 text-sm font-semibold text-white bg-[var(--color-brand-900)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-all hover:-translate-y-px hover:shadow-lg">
              Continue →
            </button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="px-8 h-12 text-[15px] font-semibold">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : "Submit Intake →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
