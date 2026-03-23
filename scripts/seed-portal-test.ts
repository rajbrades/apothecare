/**
 * Seed script: creates a test patient with dummy data for the patient portal.
 *
 * Usage:  npx tsx scripts/seed-portal-test.ts
 *
 * What it does:
 *   1. Creates a Supabase auth user (patient@test.com / testtest123)
 *   2. Finds or creates a practitioner with portal_slug
 *   3. Creates a patient linked to the auth user (portal_status = 'active')
 *   4. Creates a lab report with biomarker results (shared)
 *   5. Creates a visit note with SOAP sections (shared)
 *
 * After running, go to /portal/login and sign in with:
 *   Email:    patient@test.com
 *   Password: testtest123
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = "patient@test.com";
const TEST_PASSWORD = "testtest123";

async function main() {
  console.log("--- Patient Portal Test Seed ---\n");

  // -----------------------------------------------
  // 1. Create or find auth user for the patient
  // -----------------------------------------------
  console.log("1. Creating auth user...");
  let authUserId: string;

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === TEST_EMAIL);

  if (existing) {
    authUserId = existing.id;
    console.log(`   Auth user already exists: ${authUserId}`);
  } else {
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (authError || !newUser.user) {
      console.error("   Failed to create auth user:", authError?.message);
      process.exit(1);
    }
    authUserId = newUser.user.id;
    console.log(`   Created auth user: ${authUserId}`);
  }

  // -----------------------------------------------
  // 2. Find or create a practitioner
  // -----------------------------------------------
  console.log("2. Finding practitioner...");
  let practitionerId: string;

  const { data: practitioners } = await supabase
    .from("practitioners")
    .select("id, full_name, portal_slug")
    .limit(1);

  if (practitioners && practitioners.length > 0) {
    practitionerId = practitioners[0].id;
    console.log(`   Using practitioner: ${practitioners[0].full_name} (${practitionerId})`);

    // Ensure portal_slug is set
    if (!practitioners[0].portal_slug) {
      await supabase
        .from("practitioners")
        .update({ portal_slug: "dr-test" })
        .eq("id", practitionerId);
      console.log("   Set portal_slug to 'dr-test'");
    } else {
      console.log(`   Portal slug: ${practitioners[0].portal_slug}`);
    }
  } else {
    console.error("   No practitioners found. Please create one first (sign up as a provider).");
    process.exit(1);
  }

  // -----------------------------------------------
  // 3. Create or update test patient
  // -----------------------------------------------
  console.log("3. Creating test patient...");

  // Check if patient already exists for this auth user
  const { data: existingPatient } = await supabase
    .from("patients")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  let patientId: string;

  if (existingPatient) {
    patientId = existingPatient.id;
    console.log(`   Patient already exists: ${patientId}`);
  } else {
    // Check if there's an unlinked patient we can use
    const { data: unlinked } = await supabase
      .from("patients")
      .select("id")
      .eq("practitioner_id", practitionerId)
      .is("auth_user_id", null)
      .limit(1);

    if (unlinked && unlinked.length > 0) {
      patientId = unlinked[0].id;
      await supabase
        .from("patients")
        .update({
          auth_user_id: authUserId,
          portal_status: "active",
          first_name: "Alex",
          last_name: "Thompson",
          date_of_birth: "1988-06-15",
          sex: "female",
        })
        .eq("id", patientId);
      console.log(`   Linked auth user to existing patient: ${patientId}`);
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert({
          practitioner_id: practitionerId,
          auth_user_id: authUserId,
          portal_status: "active",
          first_name: "Alex",
          last_name: "Thompson",
          date_of_birth: "1988-06-15",
          sex: "female",
          chief_complaints: ["Chronic fatigue", "Brain fog", "Poor sleep quality"],
          medical_history: "Hashimoto's thyroiditis diagnosed 2021. IBS-D since 2019.",
          current_medications: "Levothyroxine 75mcg daily",
          supplements: "Vitamin D3 5000IU, Magnesium glycinate 400mg, B-complex",
          allergies: ["Sulfa drugs", "Shellfish"],
        })
        .select("id")
        .single();

      if (patientError || !newPatient) {
        console.error("   Failed to create patient:", patientError?.message);
        process.exit(1);
      }
      patientId = newPatient.id;
      console.log(`   Created patient: ${patientId}`);
    }
  }

  // -----------------------------------------------
  // 4. Create lab report with biomarkers
  // -----------------------------------------------
  console.log("4. Creating lab report...");

  const { data: existingLab } = await supabase
    .from("lab_reports")
    .select("id")
    .eq("patient_id", patientId)
    .eq("is_shared_with_patient", true)
    .limit(1);

  let labId: string;

  if (existingLab && existingLab.length > 0) {
    labId = existingLab[0].id;
    console.log(`   Lab report already exists: ${labId}`);
  } else {
    const { data: lab, error: labError } = await supabase
      .from("lab_reports")
      .insert({
        practitioner_id: practitionerId,
        patient_id: patientId,
        lab_vendor: "quest",
        test_type: "blood_panel",
        test_name: "Comprehensive Thyroid & Metabolic Panel",
        collection_date: "2026-03-10",
        raw_file_url: "placeholder://test-lab.pdf",
        raw_file_name: "quest_thyroid_panel_20260310.pdf",
        status: "complete",
        is_shared_with_patient: true,
      })
      .select("id")
      .single();

    if (labError || !lab) {
      console.error("   Failed to create lab report:", labError?.message);
      process.exit(1);
    }
    labId = lab.id;
    console.log(`   Created lab report: ${labId}`);

    // Insert biomarkers
    const biomarkers = [
      { biomarker_code: "TSH", biomarker_name: "TSH", category: "Thyroid", value: 3.8, unit: "mIU/L", conventional_low: 0.45, conventional_high: 4.5, functional_low: 1.0, functional_high: 2.5, conventional_flag: "normal", functional_flag: "high", interpretation: "TSH is within conventional range but above the functional optimal range, suggesting suboptimal thyroid function." },
      { biomarker_code: "FREE_T4", biomarker_name: "Free T4", category: "Thyroid", value: 1.1, unit: "ng/dL", conventional_low: 0.82, conventional_high: 1.77, functional_low: 1.1, functional_high: 1.5, conventional_flag: "normal", functional_flag: "borderline_low", interpretation: "Free T4 is at the lower end of the functional range." },
      { biomarker_code: "FREE_T3", biomarker_name: "Free T3", category: "Thyroid", value: 2.4, unit: "pg/mL", conventional_low: 2.0, conventional_high: 4.4, functional_low: 3.0, functional_high: 3.5, conventional_flag: "normal", functional_flag: "low", interpretation: "Free T3 is low in the functional range, indicating possible poor T4 to T3 conversion." },
      { biomarker_code: "TPO_AB", biomarker_name: "Thyroid Peroxidase Antibodies", category: "Thyroid", value: 234, unit: "IU/mL", conventional_low: 0, conventional_high: 35, functional_low: 0, functional_high: 15, conventional_flag: "high", functional_flag: "critical", interpretation: "Elevated TPO antibodies confirm autoimmune thyroiditis (Hashimoto's)." },
      { biomarker_code: "VITAMIN_D_25OH", biomarker_name: "Vitamin D, 25-Hydroxy", category: "Metabolic", value: 42, unit: "ng/mL", conventional_low: 30, conventional_high: 100, functional_low: 50, functional_high: 80, conventional_flag: "normal", functional_flag: "borderline_low", interpretation: "Vitamin D is adequate by conventional standards but below functional optimal." },
      { biomarker_code: "FERRITIN", biomarker_name: "Ferritin", category: "Metabolic", value: 28, unit: "ng/mL", conventional_low: 12, conventional_high: 150, functional_low: 50, functional_high: 100, conventional_flag: "normal", functional_flag: "low", interpretation: "Ferritin is low in the functional range, suggesting suboptimal iron stores despite being 'normal' conventionally." },
      { biomarker_code: "HS_CRP", biomarker_name: "hs-CRP", category: "Inflammation", value: 1.8, unit: "mg/L", conventional_low: 0, conventional_high: 3.0, functional_low: 0, functional_high: 1.0, conventional_flag: "normal", functional_flag: "borderline_high", interpretation: "Mildly elevated inflammation marker in the functional range." },
      { biomarker_code: "HBA1C", biomarker_name: "Hemoglobin A1c", category: "Metabolic", value: 5.4, unit: "%", conventional_low: 4.0, conventional_high: 5.6, functional_low: 4.5, functional_high: 5.3, conventional_flag: "normal", functional_flag: "borderline_high", interpretation: "HbA1c is at the upper edge of the functional optimal range." },
      { biomarker_code: "B12", biomarker_name: "Vitamin B12", category: "Metabolic", value: 680, unit: "pg/mL", conventional_low: 211, conventional_high: 946, functional_low: 500, functional_high: 800, conventional_flag: "normal", functional_flag: "optimal", interpretation: "B12 is well within the functional optimal range." },
    ];

    const biomarkerRows = biomarkers.map((b) => ({
      lab_report_id: labId,
      patient_id: patientId,
      ...b,
    }));

    const { error: bioError } = await supabase.from("biomarker_results").insert(biomarkerRows);
    if (bioError) {
      console.error("   Failed to insert biomarkers:", bioError.message);
    } else {
      console.log(`   Inserted ${biomarkers.length} biomarker results`);
    }
  }

  // -----------------------------------------------
  // 5. Create visit note
  // -----------------------------------------------
  console.log("5. Creating visit note...");

  const { data: existingVisit } = await supabase
    .from("visits")
    .select("id")
    .eq("patient_id", patientId)
    .eq("is_shared_with_patient", true)
    .limit(1);

  if (existingVisit && existingVisit.length > 0) {
    console.log(`   Visit note already exists: ${existingVisit[0].id}`);
  } else {
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        practitioner_id: practitionerId,
        patient_id: patientId,
        visit_date: "2026-03-15T10:00:00Z",
        visit_type: "follow_up",
        status: "completed",
        chief_complaint: "Fatigue and brain fog follow-up",
        subjective: "Patient reports persistent fatigue rated 6/10, improved from 8/10 at last visit. Brain fog continues, particularly mid-afternoon. Sleep has improved with magnesium supplementation — now averaging 7 hours vs. 5.5 previously. GI symptoms (bloating, loose stools) have decreased in frequency but still present 2-3x/week. Patient notes improved energy on days she exercises.",
        objective: "Vitals: BP 118/74, HR 68, Temp 98.2°F, Weight 142 lbs (stable). Thyroid exam: No palpable nodules, mild diffuse enlargement unchanged from prior. Skin: Mild dryness on extremities. Nails: No ridging. Hair: Minimal thinning at temples. Abdomen: Soft, mild tenderness in LLQ, no rebound.",
        assessment: "1. Hashimoto's thyroiditis — TPO antibodies remain elevated (234 IU/mL). TSH 3.8 is within conventional range but above functional optimal (1.0-2.5), suggesting room for optimization.\n2. Suboptimal thyroid hormone conversion — Free T3 at 2.4 pg/mL (functional optimal 3.0-3.5) suggests poor T4→T3 conversion.\n3. Iron deficiency (functional) — Ferritin 28 ng/mL, below functional optimal of 50-100.\n4. Vitamin D insufficiency (functional) — 42 ng/mL, below target of 50-80.\n5. Low-grade systemic inflammation — hs-CRP 1.8 mg/L.",
        plan: "1. Discuss with endocrinologist: consider levothyroxine dose adjustment from 75mcg to 88mcg to target TSH 1.0-2.5.\n2. Add selenium 200mcg daily to support T4→T3 conversion and reduce TPO antibodies.\n3. Iron supplementation: Iron bisglycinate 36mg every other day with vitamin C 500mg, recheck ferritin in 8 weeks.\n4. Increase vitamin D3 from 5000 IU to 8000 IU daily for 8 weeks, then recheck 25-OH vitamin D.\n5. Continue magnesium glycinate 400mg at bedtime.\n6. Anti-inflammatory diet focus: reduce gluten and dairy trial for 6 weeks to assess impact on GI symptoms and TPO antibodies.\n7. Follow up in 8 weeks with repeat thyroid panel + ferritin + vitamin D + hs-CRP.",
        is_shared_with_patient: true,
      })
      .select("id")
      .single();

    if (visitError || !visit) {
      console.error("   Failed to create visit:", visitError?.message);
    } else {
      console.log(`   Created visit note: ${visit.id}`);
    }
  }

  // -----------------------------------------------
  // Done!
  // -----------------------------------------------
  console.log("\n--- Setup Complete! ---\n");
  console.log("Login credentials:");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log("\nTo test the full flow:");
  console.log("  1. Go to http://localhost:3000/portal/login");
  console.log("  2. Enter patient@test.com");
  console.log("  3. Check Supabase Auth logs or use password login");
  console.log("\nNote: Magic link flow requires email delivery.");
  console.log("For direct access, the patient is already linked (portal_status = 'active').");
  console.log("The portal will redirect to consents onboarding first.\n");
}

main().catch(console.error);
