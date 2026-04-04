-- ============================================================
-- Migration 045: Corporate Protocol Library & Clinical Decision Support
-- Enterprise protocol management for corporate partners (e.g., Cenegenics)
-- ============================================================

-- 1. Corporate accounts
CREATE TABLE IF NOT EXISTS corporate_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  branding      JSONB DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_corporate_accounts
  BEFORE UPDATE ON corporate_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Corporate provider memberships
CREATE TABLE IF NOT EXISTS corporate_provider_memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id    UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'provider' CHECK (role IN ('admin', 'provider')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (corporate_id, practitioner_id)
);

CREATE INDEX idx_corp_memberships_practitioner ON corporate_provider_memberships(practitioner_id);
CREATE INDEX idx_corp_memberships_corporate ON corporate_provider_memberships(corporate_id);

-- 3. Corporate protocols
CREATE TABLE IF NOT EXISTS corporate_protocols (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id    UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN ('trt', 'hrt', 'peptides', 'metabolic', 'thyroid', 'gut', 'neuro', 'other')),
  version         INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  authored_by     TEXT,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_corp_protocols_corporate ON corporate_protocols(corporate_id, status);
CREATE INDEX idx_corp_protocols_category ON corporate_protocols(category);

CREATE TRIGGER set_updated_at_corporate_protocols
  BEFORE UPDATE ON corporate_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Protocol decision rules (matching engine)
CREATE TABLE IF NOT EXISTS protocol_decision_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id     UUID NOT NULL REFERENCES corporate_protocols(id) ON DELETE CASCADE,
  rule_name       TEXT NOT NULL,
  parameters      JSONB NOT NULL DEFAULT '{}',
  priority        INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_decision_rules_protocol ON protocol_decision_rules(protocol_id);

-- 5. Protocol steps (medications + supplements)
CREATE TABLE IF NOT EXISTS corporate_protocol_steps (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id             UUID NOT NULL REFERENCES corporate_protocols(id) ON DELETE CASCADE,
  step_order              INTEGER NOT NULL,
  step_type               TEXT NOT NULL CHECK (step_type IN ('medication', 'supplement', 'lifestyle', 'diet')),
  name                    TEXT NOT NULL,
  dosage                  TEXT,
  frequency               TEXT,
  duration                TEXT,
  cycle_on_days           INTEGER,
  cycle_off_days          INTEGER,
  titration_schedule      JSONB,
  timing                  TEXT,
  clinical_justification  TEXT NOT NULL,
  contraindications       TEXT[] DEFAULT '{}',
  references              TEXT[] DEFAULT '{}',
  phase_label             TEXT
);

CREATE INDEX idx_corp_steps_protocol ON corporate_protocol_steps(protocol_id, step_order);

-- 6. Protocol monitoring (labs + assessments)
CREATE TABLE IF NOT EXISTS corporate_protocol_monitoring (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id     UUID NOT NULL REFERENCES corporate_protocols(id) ON DELETE CASCADE,
  lab_test        TEXT NOT NULL,
  timing          TEXT NOT NULL,
  target_range    TEXT,
  escalation      TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_corp_monitoring_protocol ON corporate_protocol_monitoring(protocol_id);

-- 7. Evidence conflicts (org deviations from mainstream evidence)
CREATE TABLE IF NOT EXISTS corporate_protocol_evidence_conflicts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id         UUID NOT NULL REFERENCES corporate_protocols(id) ON DELETE CASCADE,
  conflict_description TEXT NOT NULL,
  org_justification   TEXT NOT NULL,
  evidence_refs       TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_corp_evidence_conflicts_protocol ON corporate_protocol_evidence_conflicts(protocol_id);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_provider_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_decision_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_protocol_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_protocol_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_protocol_evidence_conflicts ENABLE ROW LEVEL SECURITY;

-- Corporate accounts: members can read their org
CREATE POLICY "corp_accounts_member_select" ON corporate_accounts
  FOR SELECT USING (
    id IN (
      SELECT corporate_id FROM corporate_provider_memberships
      WHERE practitioner_id IN (
        SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
      ) AND is_active = true
    )
  );

-- Memberships: practitioners see their own
CREATE POLICY "corp_memberships_own" ON corporate_provider_memberships
  FOR SELECT USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- Protocols: members see their org's active protocols
CREATE POLICY "corp_protocols_member_select" ON corporate_protocols
  FOR SELECT USING (
    corporate_id IN (
      SELECT corporate_id FROM corporate_provider_memberships
      WHERE practitioner_id IN (
        SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
      ) AND is_active = true
    )
  );

-- Steps, monitoring, evidence conflicts, decision rules: inherit from protocol
CREATE POLICY "corp_steps_select" ON corporate_protocol_steps
  FOR SELECT USING (
    protocol_id IN (SELECT id FROM corporate_protocols)
  );

CREATE POLICY "corp_monitoring_select" ON corporate_protocol_monitoring
  FOR SELECT USING (
    protocol_id IN (SELECT id FROM corporate_protocols)
  );

CREATE POLICY "corp_evidence_conflicts_select" ON corporate_protocol_evidence_conflicts
  FOR SELECT USING (
    protocol_id IN (SELECT id FROM corporate_protocols)
  );

CREATE POLICY "corp_decision_rules_select" ON protocol_decision_rules
  FOR SELECT USING (
    protocol_id IN (SELECT id FROM corporate_protocols)
  );


-- ============================================================
-- Seed: Demo Corporate Account + Protocols
-- ============================================================

-- Demo corporate account (Cenegenics-style)
INSERT INTO corporate_accounts (id, name, slug, branding) VALUES
  ('00000000-0000-0000-0000-000000000c01', 'Age Optimization Medical Group', 'age-optimization', '{"primary_color": "#1a365d", "tagline": "Performance Medicine"}')
ON CONFLICT (slug) DO NOTHING;

-- ── Protocol 1: TRT Fertility Preservation ──────────────────────────────

INSERT INTO corporate_protocols (id, corporate_id, title, description, category, authored_by, tags) VALUES
  ('00000000-0000-0000-0000-0000000000p1',
   '00000000-0000-0000-0000-000000000c01',
   'TRT — Fertility Preservation (Male <50)',
   'Selective estrogen receptor modulator protocol for hypogonadal males under 50 who wish to preserve fertility. Avoids exogenous testosterone to maintain HPG axis function and spermatogenesis.',
   'trt', 'Medical Director', ARRAY['testosterone', 'fertility', 'serm', 'male', 'enclomiphene'])
ON CONFLICT DO NOTHING;

INSERT INTO protocol_decision_rules (protocol_id, rule_name, parameters, priority) VALUES
  ('00000000-0000-0000-0000-0000000000p1', 'Male under 50 with fertility concern',
   '{"sex": "male", "age_max": 50, "concerns": ["fertility"], "total_testosterone_max": 500, "free_testosterone_max": 15}', 10)
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_steps (protocol_id, step_order, step_type, name, dosage, frequency, duration, cycle_on_days, cycle_off_days, clinical_justification, contraindications, phase_label) VALUES
  ('00000000-0000-0000-0000-0000000000p1', 1, 'medication',
   'Enclomiphene citrate', '25mg', 'Monday through Friday', '75 days on / 14 days off',
   75, 14,
   'Selective estrogen receptor modulator (SERM) that blocks hypothalamic estrogen receptors, increasing GnRH pulsatility and downstream LH/FSH secretion. Unlike exogenous testosterone, preserves HPG axis function and spermatogenesis. M-F dosing with weekend breaks reduces estrogen receptor desensitization.',
   ARRAY['History of DVT/PE', 'Polycythemia (Hct >54%)', 'Hormone-sensitive cancers', 'Liver disease'],
   'Primary therapy'),
  ('00000000-0000-0000-0000-0000000000p1', 2, 'supplement',
   'Boron', '6mg', 'Daily', 'Continuous',
   NULL, NULL,
   'Reduces sex hormone-binding globulin (SHBG) by 10-20%, increasing free testosterone bioavailability. Also supports vitamin D metabolism and reduces inflammatory markers (hs-CRP). Dose of 6mg is above the 3mg threshold shown in clinical studies to significantly reduce SHBG within 7 days.',
   ARRAY['Renal impairment (adjust dose)'],
   'Adjunct support')
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_monitoring (protocol_id, lab_test, timing, target_range, escalation, sort_order) VALUES
  ('00000000-0000-0000-0000-0000000000p1', 'Total Testosterone', 'Baseline, Day 45, Day 75', '600-900 ng/dL', 'If <600 at day 45, increase to 50mg M-F', 1),
  ('00000000-0000-0000-0000-0000000000p1', 'Free Testosterone', 'Baseline, Day 45, Day 75', '15-25 pg/mL', 'Correlate with SHBG; adjust boron if SHBG remains elevated', 2),
  ('00000000-0000-0000-0000-0000000000p1', 'FSH', 'Baseline, Day 45', '2-8 mIU/mL', 'Rising FSH indicates HPG axis activation; if <2 consider dose increase', 3),
  ('00000000-0000-0000-0000-0000000000p1', 'LH', 'Baseline, Day 45', '3-10 mIU/mL', 'LH should rise 50-100% from baseline; if flat, reassess compliance', 4),
  ('00000000-0000-0000-0000-0000000000p1', 'Estradiol (sensitive)', 'Baseline, Day 45', '20-35 pg/mL', 'If >50 pg/mL, consider low-dose anastrozole 0.25mg 2x/week', 5),
  ('00000000-0000-0000-0000-0000000000p1', 'CBC with Hematocrit', 'Baseline, Day 75', 'Hct <54%', 'If Hct >52%, monitor closely; if >54% discontinue and refer', 6),
  ('00000000-0000-0000-0000-0000000000p1', 'Semen Analysis', 'Baseline, Month 3', 'Within normal parameters', 'Confirm spermatogenesis maintained; if declining, reassess protocol', 7)
ON CONFLICT DO NOTHING;

-- ── Protocol 2: TRT Standard Exogenous ──────────────────────────────────

INSERT INTO corporate_protocols (id, corporate_id, title, description, category, authored_by, tags) VALUES
  ('00000000-0000-0000-0000-0000000000p2',
   '00000000-0000-0000-0000-000000000c01',
   'TRT — Standard Exogenous (Male >50 or No Fertility Concern)',
   'Traditional testosterone replacement therapy with aromatase inhibitor and HCG for testicular maintenance. For males over 50 or those not concerned with future fertility.',
   'trt', 'Medical Director', ARRAY['testosterone', 'cypionate', 'hcg', 'male'])
ON CONFLICT DO NOTHING;

INSERT INTO protocol_decision_rules (protocol_id, rule_name, parameters, priority) VALUES
  ('00000000-0000-0000-0000-0000000000p2', 'Male over 50 or no fertility concern',
   '{"sex": "male", "age_min": 50, "total_testosterone_max": 500, "exclude_concerns": ["fertility"]}', 5),
  ('00000000-0000-0000-0000-0000000000p2', 'Male any age no fertility concern',
   '{"sex": "male", "total_testosterone_max": 500, "exclude_concerns": ["fertility"]}', 3)
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_steps (protocol_id, step_order, step_type, name, dosage, frequency, duration, clinical_justification, contraindications, phase_label) VALUES
  ('00000000-0000-0000-0000-0000000000p2', 1, 'medication',
   'Testosterone Cypionate', '100-200mg/week', 'Split into 2 injections (Mon/Thu)', 'Continuous with monitoring',
   'Exogenous testosterone replacement restores serum levels to physiologic range. Split dosing reduces peak/trough fluctuations and minimizes estradiol conversion spikes. Cypionate ester provides stable 7-day pharmacokinetics.',
   ARRAY['Polycythemia (Hct >54%)', 'Untreated severe OSA', 'Hormone-sensitive cancers', 'Uncontrolled heart failure'],
   'Primary therapy'),
  ('00000000-0000-0000-0000-0000000000p2', 2, 'medication',
   'Anastrozole', '0.25-0.5mg', '2x per week (injection days)', 'As needed based on E2 levels',
   'Aromatase inhibitor prevents excessive testosterone-to-estradiol conversion. Dose titrated to maintain estradiol 20-35 pg/mL. Not all patients require AI; check E2 at 6 weeks before initiating.',
   ARRAY['Osteoporosis risk with prolonged use', 'Do not crush estradiol below 15 pg/mL'],
   'Estrogen management'),
  ('00000000-0000-0000-0000-0000000000p2', 3, 'medication',
   'HCG (Human Chorionic Gonadotropin)', '500 IU', '2x per week', 'Continuous',
   'Maintains intratesticular testosterone production and testicular volume. LH-mimetic prevents testicular atrophy associated with exogenous testosterone. Also supports adrenal pregnenolone production.',
   ARRAY['HCG allergy', 'Hormone-sensitive cancers'],
   'Testicular maintenance')
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_monitoring (protocol_id, lab_test, timing, target_range, escalation, sort_order) VALUES
  ('00000000-0000-0000-0000-0000000000p2', 'Total Testosterone', 'Baseline, Week 6, Week 12, then Q6M', '700-1000 ng/dL (trough)', 'Adjust dose by 25mg increments', 1),
  ('00000000-0000-0000-0000-0000000000p2', 'Free Testosterone', 'Baseline, Week 6, Week 12', '20-30 pg/mL', 'Correlate with SHBG', 2),
  ('00000000-0000-0000-0000-0000000000p2', 'Estradiol (sensitive)', 'Week 6, then PRN', '20-35 pg/mL', 'Initiate or adjust anastrozole if >40 pg/mL', 3),
  ('00000000-0000-0000-0000-0000000000p2', 'CBC with Hematocrit', 'Baseline, Week 12, then Q6M', 'Hct <54%', 'If >52% consider therapeutic phlebotomy; if >54% reduce dose', 4),
  ('00000000-0000-0000-0000-0000000000p2', 'PSA', 'Baseline, Month 3, then annually', 'Age-appropriate (<4.0 ng/mL)', 'If rising >1.0 from baseline, refer urology', 5),
  ('00000000-0000-0000-0000-0000000000p2', 'Comprehensive Metabolic Panel', 'Baseline, Week 12', 'Within normal limits', 'Monitor hepatic function', 6)
ON CONFLICT DO NOTHING;

-- ── Protocol 3: BPC-157 Tissue Repair ───────────────────────────────────

INSERT INTO corporate_protocols (id, corporate_id, title, description, category, authored_by, tags) VALUES
  ('00000000-0000-0000-0000-0000000000p3',
   '00000000-0000-0000-0000-000000000c01',
   'Peptide — BPC-157 Tissue Repair',
   'Body Protection Compound-157 protocol for accelerated tissue repair. Promotes angiogenesis, tendon/ligament healing, and gut mucosal repair via GH receptor upregulation and nitric oxide modulation.',
   'peptides', 'Medical Director', ARRAY['bpc-157', 'tissue-repair', 'tendon', 'gut', 'peptide'])
ON CONFLICT DO NOTHING;

INSERT INTO protocol_decision_rules (protocol_id, rule_name, parameters, priority) VALUES
  ('00000000-0000-0000-0000-0000000000p3', 'Tissue injury or gut repair needed',
   '{"concerns": ["tendon injury", "ligament injury", "post-surgical", "gut repair", "tissue repair"], "exclude_concerns": ["active malignancy", "pregnancy"]}', 10)
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_steps (protocol_id, step_order, step_type, name, dosage, frequency, duration, cycle_on_days, cycle_off_days, clinical_justification, contraindications, phase_label) VALUES
  ('00000000-0000-0000-0000-0000000000p3', 1, 'medication',
   'BPC-157', '250-500mcg', 'Twice daily (subcutaneous, near injury site preferred)', '4 weeks on / 2 weeks off',
   28, 14,
   'Pentadecapeptide derived from gastric juice. Promotes angiogenesis and GH receptor expression at injury sites. Subcutaneous administration near the target tissue provides localized healing via paracrine signaling. BID dosing maintains stable tissue levels. Higher dose (500mcg) for acute injuries; 250mcg for maintenance/gut healing.',
   ARRAY['Active malignancy', 'Pregnancy/breastfeeding', 'History of hormone-sensitive cancers'],
   'Active repair phase')
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_monitoring (protocol_id, lab_test, timing, target_range, escalation, sort_order) VALUES
  ('00000000-0000-0000-0000-0000000000p3', 'Pain VAS Score', 'Weekly', '<3/10', 'If no improvement by week 2, increase to 500mcg BID', 1),
  ('00000000-0000-0000-0000-0000000000p3', 'Range of Motion Assessment', 'Week 2, Week 4', 'Progressive improvement', 'If ROM plateaus, consider adding GHK-Cu topical', 2),
  ('00000000-0000-0000-0000-0000000000p3', 'hs-CRP', 'Baseline, Day 28', '<1.0 mg/L', 'Declining CRP confirms anti-inflammatory effect', 3)
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_evidence_conflicts (protocol_id, conflict_description, org_justification, evidence_refs) VALUES
  ('00000000-0000-0000-0000-0000000000p3',
   'BPC-157 is not FDA-approved for human use. Evidence is primarily from animal models.',
   'Clinical observation in age-management practice demonstrates consistent tissue repair outcomes. Used under medical supervision with informed consent as an investigational peptide. Patients are counseled on evidence limitations. Regulatory status: not FDA-approved but not a controlled substance; available through compounding pharmacies.',
   ARRAY['Seiwerth S et al. J Physiol Pharmacol. 2018;69(3)', 'Sikiric P et al. Curr Pharm Des. 2018;24(18)'])
ON CONFLICT DO NOTHING;

-- ── Protocol 4: CJC-1295/Ipamorelin GH Secretagogue ────────────────────

INSERT INTO corporate_protocols (id, corporate_id, title, description, category, authored_by, tags) VALUES
  ('00000000-0000-0000-0000-0000000000p4',
   '00000000-0000-0000-0000-000000000c01',
   'Peptide — CJC-1295/Ipamorelin GH Secretagogue Stack',
   'Growth hormone releasing hormone (GHRH) analog + ghrelin mimetic combination for physiologic GH optimization. Preserves natural pulsatile GH release pattern. Indicated for age-related GH decline, body composition optimization, and recovery enhancement.',
   'peptides', 'Medical Director', ARRAY['cjc-1295', 'ipamorelin', 'growth-hormone', 'peptide', 'anti-aging'])
ON CONFLICT DO NOTHING;

INSERT INTO protocol_decision_rules (protocol_id, rule_name, parameters, priority) VALUES
  ('00000000-0000-0000-0000-0000000000p4', 'GH optimization candidate',
   '{"age_min": 30, "concerns": ["anti-aging", "body composition", "recovery", "gh decline", "fatigue", "poor sleep"], "exclude_concerns": ["active malignancy", "pregnancy", "diabetes uncontrolled"]}', 8)
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_steps (protocol_id, step_order, step_type, name, dosage, frequency, duration, cycle_on_days, cycle_off_days, clinical_justification, contraindications, phase_label) VALUES
  ('00000000-0000-0000-0000-0000000000p4', 1, 'medication',
   'CJC-1295 (no DAC) / Ipamorelin', '100mcg CJC-1295 + 100mcg Ipamorelin', 'Subcutaneous, before bed on empty stomach, 5 days on / 2 days off', '12 weeks per cycle',
   5, 2,
   'CJC-1295 (mod GRF 1-29) is a GHRH analog that amplifies natural GH pulses. Ipamorelin is a selective ghrelin receptor agonist that triggers GH release without significantly raising cortisol or prolactin. Combined, they produce synergistic GH release mimicking physiologic pulsatility. Bedtime dosing aligns with natural nocturnal GH surge. 5/2 cycling prevents pituitary desensitization.',
   ARRAY['Active malignancy', 'Uncontrolled diabetes', 'Pregnancy', 'Pituitary tumors', 'Active retinopathy'],
   'GH optimization')
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_monitoring (protocol_id, lab_test, timing, target_range, escalation, sort_order) VALUES
  ('00000000-0000-0000-0000-0000000000p4', 'IGF-1', 'Baseline, Week 6, Week 12', '200-350 ng/mL (age-adjusted)', 'If <200 at week 6, increase to 150mcg each; if >350, reduce dose', 1),
  ('00000000-0000-0000-0000-0000000000p4', 'Fasting Glucose/HbA1c', 'Baseline, Week 12', 'FG <100 mg/dL, HbA1c <5.7%', 'GH can impair insulin sensitivity; if FG >110, add metformin or reduce dose', 2),
  ('00000000-0000-0000-0000-0000000000p4', 'Body Composition (DEXA)', 'Baseline, Week 12', 'Improved lean mass / reduced fat mass', 'Objective measure of protocol efficacy', 3),
  ('00000000-0000-0000-0000-0000000000p4', 'Sleep Quality (PSQI)', 'Baseline, Week 4, Week 12', 'Improvement from baseline', 'GH secretagogues should improve sleep architecture; if not, assess compliance and timing', 4)
ON CONFLICT DO NOTHING;

-- ── Protocol 5: GHK-Cu Tissue Remodeling ────────────────────────────────

INSERT INTO corporate_protocols (id, corporate_id, title, description, category, authored_by, tags) VALUES
  ('00000000-0000-0000-0000-0000000000p5',
   '00000000-0000-0000-0000-000000000c01',
   'Peptide — GHK-Cu Tissue Remodeling & Anti-Aging',
   'Copper peptide protocol for skin/tissue remodeling, wound healing, and anti-aging. GHK-Cu is a naturally occurring tripeptide that declines with age. Available in topical and injectable forms with distinct applications.',
   'peptides', 'Medical Director', ARRAY['ghk-cu', 'copper-peptide', 'anti-aging', 'skin', 'wound-healing'])
ON CONFLICT DO NOTHING;

INSERT INTO protocol_decision_rules (protocol_id, rule_name, parameters, priority) VALUES
  ('00000000-0000-0000-0000-0000000000p5', 'Tissue remodeling or anti-aging',
   '{"concerns": ["skin aging", "wound healing", "tissue remodeling", "collagen loss", "hair thinning", "anti-aging"], "exclude_concerns": ["active malignancy", "Wilson disease"]}', 7)
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_steps (protocol_id, step_order, step_type, name, dosage, frequency, duration, clinical_justification, contraindications, phase_label) VALUES
  ('00000000-0000-0000-0000-0000000000p5', 1, 'medication',
   'GHK-Cu (injectable)', '1-2mg', 'Subcutaneous, daily for 4 weeks then 3x/week', '12 weeks',
   'GHK-Cu activates tissue remodeling genes including collagen synthesis (COL1A1, COL3A1), decorin, and metalloproteinases. Upregulates stem cell markers and antioxidant enzymes (SOD, glutathione). Injectable route provides systemic distribution for whole-body tissue remodeling. Loading phase (daily x 4 weeks) followed by maintenance (3x/week).',
   ARRAY['Wilson disease (copper metabolism disorder)', 'Active malignancy', 'Copper allergy'],
   'Systemic protocol'),
  ('00000000-0000-0000-0000-0000000000p5', 2, 'medication',
   'GHK-Cu (topical cream 0.1%)', 'Apply to face/target area', 'Twice daily', 'Continuous',
   'Topical application provides localized collagen stimulation and skin remodeling. Penetrates dermis to activate fibroblasts. Can be used concurrently with injectable protocol for enhanced facial/skin results. 0.1% concentration is clinically effective without irritation.',
   ARRAY['Open wounds (wait for initial closure)', 'Contact dermatitis to copper'],
   'Topical adjunct')
ON CONFLICT DO NOTHING;

INSERT INTO corporate_protocol_monitoring (protocol_id, lab_test, timing, target_range, escalation, sort_order) VALUES
  ('00000000-0000-0000-0000-0000000000p5', 'Serum Copper', 'Baseline, Week 6', '70-140 mcg/dL', 'If elevated, reduce injectable frequency', 1),
  ('00000000-0000-0000-0000-0000000000p5', 'Ceruloplasmin', 'Baseline', '20-35 mg/dL', 'Rule out copper metabolism disorders before starting', 2),
  ('00000000-0000-0000-0000-0000000000p5', 'Skin Photography', 'Baseline, Week 6, Week 12', 'Visual improvement', 'Standardized photography for objective assessment', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Record in schema_migrations
-- ============================================================
INSERT INTO schema_migrations (version, name) VALUES ('045', 'corporate_protocol_library')
ON CONFLICT (version) DO NOTHING;
