-- Migration 041: Expanded functional ranges for common biomarkers
-- Adds functional/optimal ranges for CBC, liver, kidney, metabolic, lipid,
-- iron, hormone, and inflammation biomarkers that were missing from the
-- initial seed data (migration 001).
--
-- Sources: IFM Guidelines, A4M Guidelines, Functional Medicine research literature.
-- All ranges represent evidence-based functional/optimal targets, tighter than
-- conventional lab reference ranges.

-- ═══════════════════════════════════════════════════════════════════════
-- CBC (supplement existing entries + add new ones)
-- ═══════════════════════════════════════════════════════════════════════

-- MCH (Mean Corpuscular Hemoglobin)
INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('MCH', 'Mean Corpuscular Hemoglobin', 'cbc', 26.6, 33.0, 'pg', 28, 32, 'Average hemoglobin per RBC', 'Low MCH suggests iron deficiency. High MCH suggests B12/folate deficiency. Evaluate alongside MCV.', 'IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = 28, functional_high = 32, clinical_notes = EXCLUDED.clinical_notes;

-- MCHC (Mean Corpuscular Hemoglobin Concentration)
INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('MCHC', 'Mean Corpuscular Hemoglobin Concentration', 'cbc', 31.5, 35.7, 'g/dL', 32, 35, 'Hemoglobin concentration per RBC', 'Low MCHC seen in iron deficiency and thalassemia. High MCHC in spherocytosis.', 'IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = 32, functional_high = 35, clinical_notes = EXCLUDED.clinical_notes;

-- RDW (Red Cell Distribution Width)
INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('RDW', 'Red Cell Distribution Width', 'cbc', 11.6, 15.4, '%', 11.5, 13.0, 'Variation in red blood cell size', 'Elevated RDW indicates mixed cell populations — seen in iron, B12, or folate deficiency. Also a cardiovascular risk marker.', 'IFM / A4M Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = 11.5, functional_high = 13.0, clinical_notes = EXCLUDED.clinical_notes;

-- Neutrophils %
INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('NEUT_PCT', 'Neutrophils', 'cbc', 40, 74, '%', 40, 60, 'Neutrophil percentage', 'Elevated neutrophils suggest bacterial infection or acute stress. Low values suggest immune compromise.', 'IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = 40, functional_high = 60, clinical_notes = EXCLUDED.clinical_notes;

-- Lymphocytes %
INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('LYMPH_PCT', 'Lymphocytes', 'cbc', 14, 46, '%', 24, 44, 'Lymphocyte percentage', 'Low lymphocytes may indicate viral infection, immune suppression, or cortisol excess.', 'IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = 24, functional_high = 44, clinical_notes = EXCLUDED.clinical_notes;

-- Monocytes %
INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('MONO_PCT', 'Monocytes', 'cbc', 4, 13, '%', 4, 7, 'Monocyte percentage', 'Elevated monocytes suggest chronic infection, inflammation, or recovery from acute illness.', 'IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = 4, functional_high = 7, clinical_notes = EXCLUDED.clinical_notes;

-- ═══════════════════════════════════════════════════════════════════════
-- LIVER
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('ALT', 'Alanine Aminotransferase', 'liver', 0, 44, 'IU/L', 0, 25, 'Liver cell damage marker', 'Functional target <25. Values 25-44 may indicate fatty liver, metabolic stress, or medication effects.', 'IFM Guidelines'),
('AST', 'Aspartate Aminotransferase', 'liver', 0, 40, 'IU/L', 0, 25, 'Liver/muscle damage marker', 'Also found in heart and muscle tissue. Functional target <25. AST:ALT ratio >2 suggests alcoholic liver disease.', 'IFM Guidelines'),
('ALP', 'Alkaline Phosphatase', 'liver', 44, 121, 'IU/L', 50, 100, 'Bone and liver enzyme', 'Very low ALP (<50) may indicate zinc deficiency. Elevated may be liver or bone origin — check GGT to differentiate.', 'IFM / A4M Guidelines'),
('GGT', 'Gamma-Glutamyl Transferase', 'liver', 0, 65, 'IU/L', 0, 30, 'Liver enzyme and glutathione marker', 'Functional target <30. Elevated GGT indicates oxidative stress, liver congestion, or alcohol use. Also a cardiovascular risk marker.', 'IFM / A4M Guidelines'),
('BILIRUBIN_TOTAL', 'Bilirubin, Total', 'liver', 0, 1.2, 'mg/dL', 0.2, 1.0, 'Heme breakdown product', 'Mildly elevated bilirubin (Gilberts) may be protective as an antioxidant. Very low may indicate poor heme recycling.', 'IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = EXCLUDED.functional_low, functional_high = EXCLUDED.functional_high, clinical_notes = EXCLUDED.clinical_notes;

-- ═══════════════════════════════════════════════════════════════════════
-- KIDNEY
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('BUN', 'Blood Urea Nitrogen', 'kidney', 6, 24, 'mg/dL', 10, 16, 'Protein metabolism and kidney function', 'Low BUN (<10) may indicate low protein intake or liver dysfunction. High BUN may indicate dehydration, kidney stress, or excessive protein intake.', 'IFM Guidelines'),
('CREATININE', 'Creatinine', 'kidney', 0.76, 1.27, 'mg/dL', 0.8, 1.1, 'Kidney filtration marker', 'Evaluate alongside eGFR. Low creatinine may indicate low muscle mass. High creatinine suggests reduced kidney function.', 'IFM Guidelines'),
('BUN_CREATININE_RATIO', 'BUN/Creatinine Ratio', 'kidney', 9, 20, 'ratio', 10, 16, 'Kidney and hydration status', 'High ratio suggests dehydration or GI bleeding. Low ratio may indicate liver disease or low protein diet.', 'IFM Guidelines'),
('EGFR', 'Estimated Glomerular Filtration Rate', 'kidney', 59, 999, 'mL/min/1.73', 90, 999, 'Kidney filtration rate', 'Functional target >90. Values 60-89 indicate mild kidney function decline. Below 60 is concerning.', 'IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = EXCLUDED.functional_low, functional_high = EXCLUDED.functional_high, clinical_notes = EXCLUDED.clinical_notes;

-- ═══════════════════════════════════════════════════════════════════════
-- METABOLIC (supplement existing + add new)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('GLUCOSE', 'Glucose, Fasting', 'metabolic', 70, 99, 'mg/dL', 75, 86, 'Fasting blood sugar', 'Functional target 75-86. Values 87-99 suggest early insulin resistance even if conventionally normal.', 'IFM / A4M Guidelines'),
('ALBUMIN', 'Albumin', 'metabolic', 3.5, 5.5, 'g/dL', 4.1, 5.1, 'Protein status and liver function', 'Low albumin indicates inflammation, malnutrition, or liver dysfunction. Functional target >4.1.', 'IFM Guidelines'),
('GLOBULIN', 'Globulin, Total', 'metabolic', 1.5, 4.5, 'g/dL', 2.4, 2.8, 'Immune protein fraction', 'High globulin suggests chronic infection or inflammation. Low may indicate immune deficiency.', 'IFM Guidelines'),
('AG_RATIO', 'Albumin/Globulin Ratio', 'metabolic', 1.2, 2.2, 'ratio', 1.5, 2.0, 'Protein balance marker', 'Low ratio suggests inflammation or liver disease. High ratio is generally favorable.', 'IFM Guidelines'),
('CALCIUM', 'Calcium', 'metabolic', 8.7, 10.2, 'mg/dL', 9.2, 10.0, 'Bone and parathyroid function', 'Evaluate with PTH and vitamin D. Persistently high calcium may indicate hyperparathyroidism.', 'IFM Guidelines'),
('SODIUM', 'Sodium', 'metabolic', 134, 144, 'mmol/L', 136, 142, 'Electrolyte and fluid balance', 'Low sodium may indicate adrenal insufficiency or overhydration. High sodium suggests dehydration.', 'IFM Guidelines'),
('POTASSIUM', 'Potassium', 'metabolic', 3.5, 5.2, 'mmol/L', 4.0, 4.5, 'Electrolyte and cardiac function', 'Critical electrolyte for cardiac rhythm. Functional target 4.0-4.5 for optimal cellular function.', 'IFM Guidelines'),
('CHLORIDE', 'Chloride', 'metabolic', 96, 106, 'mmol/L', 100, 106, 'Electrolyte and acid-base balance', 'Low chloride may indicate metabolic alkalosis. Evaluate alongside CO2 and sodium.', 'IFM Guidelines'),
('CO2', 'Carbon Dioxide, Total', 'metabolic', 20, 29, 'mmol/L', 25, 30, 'Acid-base balance marker', 'Low CO2 may indicate metabolic acidosis or hyperventilation. Optimal is 25-30.', 'IFM Guidelines'),
('PROTEIN_TOTAL', 'Protein, Total', 'metabolic', 6.0, 8.5, 'g/dL', 6.9, 7.4, 'Total serum protein', 'Low protein may indicate malabsorption or protein deficiency. High protein may suggest chronic inflammation.', 'IFM Guidelines'),
('URIC_ACID', 'Uric Acid', 'metabolic', 2.4, 8.2, 'mg/dL', 3.0, 5.5, 'Purine metabolism marker', 'Elevated uric acid is a risk factor for gout, kidney stones, and cardiovascular disease. Also an antioxidant at lower levels.', 'IFM / A4M Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = EXCLUDED.functional_low, functional_high = EXCLUDED.functional_high, clinical_notes = EXCLUDED.clinical_notes;

-- ═══════════════════════════════════════════════════════════════════════
-- LIPID (supplement existing + add new)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('VLDL', 'VLDL Cholesterol', 'lipid', 0, 40, 'mg/dL', 0, 20, 'Very low-density lipoprotein', 'VLDL is triglyceride-rich. Functional target <20. Elevated VLDL indicates metabolic syndrome.', 'IFM Guidelines'),
('LDL_HDL_RATIO', 'LDL/HDL Ratio', 'lipid', 0, 3.6, 'ratio', 0, 2.5, 'Cardiovascular risk ratio', 'Lower is better. Functional target <2.5 for cardiovascular protection.', 'A4M Guidelines'),
('APO_B', 'Apolipoprotein B', 'lipid', 0, 130, 'mg/dL', 0, 80, 'Atherogenic particle count proxy', 'Better predictor of CVD risk than LDL alone. Each atherogenic particle has one ApoB. Target <80.', 'A4M / IFM Guidelines'),
('LP_A', 'Lipoprotein(a)', 'lipid', 0, 75, 'nmol/L', 0, 30, 'Genetic cardiovascular risk marker', 'Genetically determined. Values >30 nmol/L significantly increase CVD risk. Not modifiable by lifestyle alone.', 'A4M / Cardiovascular Research')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = EXCLUDED.functional_low, functional_high = EXCLUDED.functional_high, clinical_notes = EXCLUDED.clinical_notes;

-- ═══════════════════════════════════════════════════════════════════════
-- IRON (supplement existing + add new)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('IRON', 'Iron, Serum', 'iron', 38, 169, 'ug/dL', 60, 120, 'Circulating iron', 'Varies throughout the day. Best measured fasting AM. Low iron with low ferritin confirms iron deficiency.', 'IFM Guidelines'),
('TIBC', 'Total Iron Binding Capacity', 'iron', 250, 450, 'ug/dL', 250, 350, 'Iron transport capacity', 'High TIBC indicates iron deficiency (body making more transport proteins). Low TIBC in chronic disease.', 'IFM Guidelines'),
('IRON_SAT', 'Iron Saturation', 'iron', 15, 55, '%', 25, 35, 'Transferrin saturation percentage', 'Functional target 25-35%. Below 20% strongly suggests iron deficiency. Above 45% may indicate hemochromatosis.', 'IFM / A4M Guidelines'),
('UIBC', 'Unsaturated Iron Binding Capacity', 'iron', 111, 343, 'ug/dL', 150, 275, 'Available iron transport capacity', 'High UIBC suggests iron deficiency. Low UIBC may indicate iron overload or chronic disease.', 'IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = EXCLUDED.functional_low, functional_high = EXCLUDED.functional_high, clinical_notes = EXCLUDED.clinical_notes;

-- ═══════════════════════════════════════════════════════════════════════
-- HORMONE (supplement existing + add new)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('FREE_TESTOSTERONE', 'Testosterone, Free', 'hormone', NULL, NULL, 'ng/dL', NULL, NULL, 'Bioavailable testosterone (age/sex dependent)', 'Males: functional target 15-25 pg/mL. Females: 1.0-3.5 pg/mL. Evaluate with SHBG and total testosterone.', 'A4M Guidelines'),
('ESTRADIOL', 'Estradiol, Sensitive', 'hormone', NULL, NULL, 'pg/mL', NULL, NULL, 'Primary estrogen (age/sex/cycle dependent)', 'Males: functional target 20-30 pg/mL. Females vary by cycle phase. Evaluate in clinical context.', 'A4M Guidelines'),
('PROGESTERONE', 'Progesterone', 'hormone', 0, 0.5, 'ng/mL', NULL, NULL, 'Progesterone (sex/cycle dependent)', 'Males: low baseline normal. Females: cycle phase dependent. Luteal phase functional target 10-25.', 'A4M Guidelines'),
('FSH', 'Follicle Stimulating Hormone', 'hormone', 1.5, 12.4, 'mIU/mL', 3, 8, 'Pituitary gonadotropin', 'Elevated FSH in females suggests diminished ovarian reserve. In males may indicate testicular dysfunction.', 'A4M Guidelines'),
('LH', 'Luteinizing Hormone', 'hormone', 1.7, 8.6, 'mIU/mL', 2, 6, 'Pituitary gonadotropin', 'LH:FSH ratio is clinically useful. Elevated ratio in PCOS. Low LH may indicate pituitary suppression.', 'A4M Guidelines'),
('PROLACTIN', 'Prolactin', 'hormone', 3.9, 22.7, 'ng/mL', 5, 15, 'Pituitary hormone', 'Elevated prolactin may indicate pituitary adenoma, medication effect, or stress. Suppresses gonadal function.', 'A4M Guidelines'),
('SHBG', 'Sex Hormone Binding Globulin', 'hormone', 16.5, 55.9, 'nmol/L', 20, 50, 'Hormone transport protein', 'High SHBG reduces free testosterone. Low SHBG associated with insulin resistance and metabolic syndrome.', 'A4M / IFM Guidelines'),
('IGF1', 'Insulin-Like Growth Factor 1', 'hormone', 84, 270, 'ng/mL', 150, 250, 'Growth hormone surrogate marker', 'Reflects GH secretion. Optimal in upper-middle range for age. Low suggests GH deficiency or malnutrition.', 'A4M Guidelines'),
('PCT_FREE_TESTOSTERONE', '% Free Testosterone', 'hormone', 1.5, 4.2, '%', 2.0, 3.5, 'Percent of unbound testosterone', 'Low percentage suggests excessive SHBG binding. Evaluate alongside total testosterone and SHBG.', 'A4M Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = EXCLUDED.functional_low, functional_high = EXCLUDED.functional_high, clinical_notes = EXCLUDED.clinical_notes;

-- ═══════════════════════════════════════════════════════════════════════
-- INFLAMMATION
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('ESR', 'Erythrocyte Sedimentation Rate', 'inflammation', 0, 22, 'mm/hr', 0, 10, 'Non-specific inflammation marker', 'Functional target <10. Elevated ESR indicates chronic inflammation, infection, or autoimmune disease.', 'IFM Guidelines'),
('FIBRINOGEN', 'Fibrinogen', 'inflammation', 200, 400, 'mg/dL', 200, 300, 'Clotting and inflammation marker', 'Elevated fibrinogen is a cardiovascular risk factor and indicates systemic inflammation.', 'A4M / IFM Guidelines')
ON CONFLICT (biomarker_code) DO UPDATE SET functional_low = EXCLUDED.functional_low, functional_high = EXCLUDED.functional_high, clinical_notes = EXCLUDED.clinical_notes;
