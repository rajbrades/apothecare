-- ===========================================
-- APOTHECA - Initial Database Schema
-- ===========================================
-- Functional Medicine AI Clinical Decision Support Platform
-- HIPAA-compliant schema with Row-Level Security
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE license_type AS ENUM (
  'md', 'do', 'np', 'aprn', 'pa', 'dc', 'nd', 'lac', 'other'
);

CREATE TYPE verification_status AS ENUM (
  'pending', 'verified', 'rejected', 'expired'
);

CREATE TYPE subscription_tier AS ENUM (
  'free', 'pro'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'past_due', 'canceled', 'trialing'
);

CREATE TYPE message_role AS ENUM (
  'user', 'assistant', 'system'
);

CREATE TYPE lab_vendor AS ENUM (
  'quest', 'labcorp', 'diagnostic_solutions', 'genova', 'precision_analytical',
  'mosaic', 'vibrant', 'spectracell', 'realtime_labs', 'zrt', 'other'
);

CREATE TYPE lab_test_type AS ENUM (
  'blood_panel', 'stool_analysis', 'saliva_hormone', 'urine_hormone',
  'organic_acids', 'micronutrient', 'genetic', 'food_sensitivity',
  'mycotoxin', 'environmental', 'other'
);

CREATE TYPE lab_report_status AS ENUM (
  'uploading', 'classifying', 'parsing', 'interpreting', 'complete', 'error'
);

CREATE TYPE biomarker_flag AS ENUM (
  'optimal', 'normal', 'borderline_low', 'borderline_high', 'low', 'high', 'critical'
);

CREATE TYPE evidence_level AS ENUM (
  'meta_analysis', 'rct', 'cohort_study', 'case_study',
  'clinical_guideline', 'expert_consensus', 'in_vitro', 'other'
);

CREATE TYPE audit_action AS ENUM (
  'create', 'read', 'update', 'delete', 'export', 'login', 'logout',
  'upload', 'query', 'generate'
);

-- ===========================================
-- PRACTITIONERS (Users)
-- ===========================================

CREATE TABLE practitioners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL, -- links to Supabase Auth
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  
  -- Credentials
  license_type license_type NOT NULL,
  license_number TEXT,
  license_state TEXT,
  npi TEXT,
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  
  -- Practice info
  practice_name TEXT,
  specialty_focus TEXT[], -- e.g., ['hormone_optimization', 'gi_health', 'metabolic']
  years_in_practice INTEGER,
  
  -- Subscription
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Usage tracking
  daily_query_count INTEGER DEFAULT 0,
  daily_query_reset_at TIMESTAMPTZ DEFAULT NOW(),
  monthly_lab_count INTEGER DEFAULT 0,
  monthly_lab_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Preferences
  preferred_evidence_sources TEXT[], -- e.g., ['ifm', 'a4m', 'pubmed']
  default_note_template TEXT DEFAULT 'soap',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_practitioners_auth_user ON practitioners(auth_user_id);
CREATE INDEX idx_practitioners_email ON practitioners(email);
CREATE INDEX idx_practitioners_npi ON practitioners(npi);
CREATE INDEX idx_practitioners_subscription ON practitioners(subscription_tier, subscription_status);

-- ===========================================
-- PATIENTS
-- ===========================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  
  -- Demographics (all optional for privacy)
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  sex TEXT, -- 'male', 'female', 'other'
  
  -- Clinical context
  chief_complaints TEXT[],
  medical_history TEXT,
  current_medications TEXT,
  supplements TEXT,
  allergies TEXT[],
  
  -- Notes
  notes TEXT,
  
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_practitioner ON patients(practitioner_id);

-- ===========================================
-- CONVERSATIONS (Clinical Chat)
-- ===========================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  
  title TEXT,
  is_deep_consult BOOLEAN DEFAULT FALSE,
  model_used TEXT DEFAULT 'claude-sonnet-4-5-20250929',
  
  is_favorited BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_practitioner ON conversations(practitioner_id);
CREATE INDEX idx_conversations_patient ON conversations(patient_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- ===========================================
-- MESSAGES
-- ===========================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  role message_role NOT NULL,
  content TEXT NOT NULL,
  
  -- Citation metadata (for assistant messages)
  citations JSONB DEFAULT '[]',
  -- Format: [{ source, title, authors, year, doi, url, evidence_level, relevance_score, excerpt }]
  
  -- Token tracking
  input_tokens INTEGER,
  output_tokens INTEGER,
  
  -- Thinking/reasoning (for extended thinking responses)
  thinking_content TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ===========================================
-- VISITS (Clinical Documentation)
-- ===========================================

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  
  -- Visit metadata
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  note_template TEXT DEFAULT 'soap', -- 'soap', 'ifm_matrix', 'focused', 'follow_up'
  
  -- Clinical documentation
  chief_complaint TEXT,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  
  -- Free-form notes
  raw_notes TEXT,
  
  -- AI-generated content
  ai_soap_note TEXT,
  ai_assessment TEXT,
  ai_plan TEXT,
  
  -- IFM Matrix data (structured)
  ifm_matrix JSONB DEFAULT '{}',
  -- Format: { assimilation: {}, defense_repair: {}, energy: {}, biotransformation: {},
  --           transport: {}, communication: {}, structural_integrity: {} }
  
  -- Linked conversation for follow-up questions
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visits_practitioner ON visits(practitioner_id);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_date ON visits(visit_date DESC);

-- ===========================================
-- LAB REPORTS
-- ===========================================

CREATE TABLE lab_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  
  -- Lab metadata
  lab_vendor lab_vendor DEFAULT 'other',
  test_type lab_test_type NOT NULL,
  test_name TEXT, -- e.g., "GI-MAP", "DUTCH Complete", "Comprehensive Metabolic Panel"
  collection_date DATE,
  
  -- File storage
  raw_file_url TEXT NOT NULL, -- Supabase Storage URL (encrypted)
  raw_file_name TEXT,
  raw_file_size INTEGER,
  
  -- Parsed data
  parsed_data JSONB DEFAULT '{}', -- Full structured extraction
  status lab_report_status DEFAULT 'uploading',
  error_message TEXT,
  
  -- Processing metadata
  parsing_model TEXT,
  parsing_confidence FLOAT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_reports_practitioner ON lab_reports(practitioner_id);
CREATE INDEX idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX idx_lab_reports_status ON lab_reports(status);

-- ===========================================
-- BIOMARKER RESULTS (Extracted from lab reports)
-- ===========================================

CREATE TABLE biomarker_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  
  -- Biomarker identification
  biomarker_code TEXT NOT NULL, -- standardized code (e.g., 'TSH', 'VITAMIN_D_25OH')
  biomarker_name TEXT NOT NULL, -- display name (e.g., 'TSH', 'Vitamin D, 25-Hydroxy')
  category TEXT, -- e.g., 'thyroid', 'metabolic', 'hormone', 'inflammation'
  
  -- Value
  value FLOAT NOT NULL,
  unit TEXT NOT NULL,
  
  -- Conventional reference range
  conventional_low FLOAT,
  conventional_high FLOAT,
  conventional_flag biomarker_flag,
  
  -- Functional/optimal range
  functional_low FLOAT,
  functional_high FLOAT,
  functional_flag biomarker_flag,
  
  -- Interpretation
  interpretation TEXT, -- AI-generated interpretation for this marker
  clinical_significance TEXT, -- Brief clinical note
  
  collection_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_biomarker_results_lab ON biomarker_results(lab_report_id);
CREATE INDEX idx_biomarker_results_patient ON biomarker_results(patient_id);
CREATE INDEX idx_biomarker_results_code ON biomarker_results(biomarker_code);
CREATE INDEX idx_biomarker_results_date ON biomarker_results(collection_date DESC);

-- ===========================================
-- CLINICAL REVIEWS (AI-generated analysis)
-- ===========================================

CREATE TABLE clinical_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  
  -- Source labs
  lab_report_ids UUID[] NOT NULL,
  
  -- Review content (structured)
  executive_summary TEXT,
  system_analysis JSONB DEFAULT '{}', -- IFM node-based analysis
  cross_lab_correlations TEXT,
  differential_considerations TEXT,
  
  -- Protocol recommendations
  protocol JSONB DEFAULT '{}',
  -- Format: { supplements: [], dietary: [], lifestyle: [], follow_up: {} }
  
  -- Citations
  citations JSONB DEFAULT '[]',
  
  -- Model info
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clinical_reviews_practitioner ON clinical_reviews(practitioner_id);
CREATE INDEX idx_clinical_reviews_patient ON clinical_reviews(patient_id);

-- ===========================================
-- EVIDENCE DOCUMENTS (RAG Knowledge Base)
-- ===========================================

CREATE TABLE evidence_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Source metadata
  source TEXT NOT NULL, -- 'pubmed', 'ifm', 'a4m', 'cleveland_clinic', 'fmu'
  title TEXT NOT NULL,
  authors TEXT[],
  publication TEXT, -- journal name or source name
  published_date DATE,
  doi TEXT,
  url TEXT,
  
  -- Content
  abstract TEXT,
  full_text TEXT,
  
  -- Classification
  evidence_level evidence_level,
  topics TEXT[], -- e.g., ['thyroid', 'hashimotos', 'selenium']
  conditions TEXT[], -- e.g., ['hypothyroidism', 'autoimmune_thyroiditis']
  interventions TEXT[], -- e.g., ['selenium_supplementation', 'gluten_free_diet']
  
  -- Ingestion metadata
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_documents_source ON evidence_documents(source);
CREATE INDEX idx_evidence_documents_topics ON evidence_documents USING GIN(topics);
CREATE INDEX idx_evidence_documents_conditions ON evidence_documents USING GIN(conditions);

-- ===========================================
-- EVIDENCE CHUNKS (For RAG retrieval)
-- ===========================================

CREATE TABLE evidence_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES evidence_documents(id) ON DELETE CASCADE,
  
  -- Chunk content
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL, -- position within document
  
  -- Vector embedding
  embedding vector(1536), -- OpenAI text-embedding-3-large dimension
  
  -- Metadata for filtering
  section_type TEXT, -- 'abstract', 'methods', 'results', 'discussion', 'conclusion'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_chunks_document ON evidence_chunks(document_id);
CREATE INDEX idx_evidence_chunks_embedding ON evidence_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ===========================================
-- BIOMARKER REFERENCE RANGES
-- ===========================================

CREATE TABLE biomarker_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  biomarker_code TEXT UNIQUE NOT NULL,
  biomarker_name TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Conventional ranges
  conventional_low FLOAT,
  conventional_high FLOAT,
  conventional_unit TEXT NOT NULL,
  
  -- Functional/optimal ranges
  functional_low FLOAT,
  functional_high FLOAT,
  
  -- Context
  description TEXT,
  clinical_notes TEXT, -- Why functional range differs from conventional
  
  -- Metadata
  source TEXT, -- Where the functional range comes from
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_biomarker_references_code ON biomarker_references(biomarker_code);
CREATE INDEX idx_biomarker_references_category ON biomarker_references(category);

-- ===========================================
-- AUDIT LOG (HIPAA Requirement)
-- ===========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  practitioner_id UUID REFERENCES practitioners(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  
  -- What was accessed/modified
  resource_type TEXT NOT NULL, -- 'patient', 'lab_report', 'conversation', etc.
  resource_id UUID,
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  
  -- Additional detail
  detail JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_practitioner ON audit_logs(practitioner_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ===========================================
-- ROW-LEVEL SECURITY POLICIES
-- ===========================================

ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Practitioners can only see/edit their own profile
CREATE POLICY "practitioners_own_data" ON practitioners
  FOR ALL USING (auth_user_id = auth.uid());

-- Practitioners can only see/edit their own patients
CREATE POLICY "patients_own_data" ON patients
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Practitioners can only see/edit their own conversations
CREATE POLICY "conversations_own_data" ON conversations
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Messages inherit conversation access
CREATE POLICY "messages_own_data" ON messages
  FOR ALL USING (conversation_id IN (
    SELECT id FROM conversations WHERE practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  ));

-- Practitioners can only see/edit their own visits
CREATE POLICY "visits_own_data" ON visits
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Practitioners can only see/edit their own lab reports
CREATE POLICY "lab_reports_own_data" ON lab_reports
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Biomarker results inherit lab report access
CREATE POLICY "biomarker_results_own_data" ON biomarker_results
  FOR ALL USING (lab_report_id IN (
    SELECT id FROM lab_reports WHERE practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  ));

-- Clinical reviews
CREATE POLICY "clinical_reviews_own_data" ON clinical_reviews
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Audit logs: practitioners can read their own, service role can write all
CREATE POLICY "audit_logs_read_own" ON audit_logs
  FOR SELECT USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Evidence tables are public read (no PHI)
ALTER TABLE evidence_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_documents_public_read" ON evidence_documents
  FOR SELECT USING (true);

CREATE POLICY "evidence_chunks_public_read" ON evidence_chunks
  FOR SELECT USING (true);

CREATE POLICY "biomarker_references_public_read" ON biomarker_references
  FOR SELECT USING (true);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_practitioners_updated_at
  BEFORE UPDATE ON practitioners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lab_reports_updated_at
  BEFORE UPDATE ON lab_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clinical_reviews_updated_at
  BEFORE UPDATE ON clinical_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reset daily query count
CREATE OR REPLACE FUNCTION reset_daily_queries()
RETURNS void AS $$
BEGIN
  UPDATE practitioners
  SET daily_query_count = 0, daily_query_reset_at = NOW()
  WHERE daily_query_reset_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Increment query count and check limit
CREATE OR REPLACE FUNCTION check_and_increment_query(p_practitioner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier subscription_tier;
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
  v_limit INTEGER;
BEGIN
  SELECT subscription_tier, daily_query_count, daily_query_reset_at
  INTO v_tier, v_count, v_reset
  FROM practitioners WHERE id = p_practitioner_id;

  -- Reset if new day
  IF v_reset < NOW() - INTERVAL '1 day' THEN
    UPDATE practitioners
    SET daily_query_count = 0, daily_query_reset_at = NOW()
    WHERE id = p_practitioner_id;
    v_count := 0;
  END IF;

  -- Set limit based on tier
  v_limit := CASE v_tier
    WHEN 'free' THEN 2
    WHEN 'pro' THEN 999999 -- effectively unlimited
  END;

  -- Check limit
  IF v_count >= v_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment
  UPDATE practitioners
  SET daily_query_count = daily_query_count + 1
  WHERE id = p_practitioner_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Semantic search function for RAG
CREATE OR REPLACE FUNCTION search_evidence(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  source TEXT,
  title TEXT,
  authors TEXT[],
  publication TEXT,
  published_date DATE,
  doi TEXT,
  evidence_level evidence_level
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.document_id,
    ec.content,
    1 - (ec.embedding <=> query_embedding) AS similarity,
    ed.source,
    ed.title,
    ed.authors,
    ed.publication,
    ed.published_date,
    ed.doi,
    ed.evidence_level
  FROM evidence_chunks ec
  JOIN evidence_documents ed ON ec.document_id = ed.id
  WHERE 1 - (ec.embedding <=> query_embedding) > match_threshold
    AND (filter_source IS NULL OR ed.source = filter_source)
  ORDER BY ec.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- SEED: Biomarker Reference Ranges
-- ===========================================

INSERT INTO biomarker_references (biomarker_code, biomarker_name, category, conventional_low, conventional_high, conventional_unit, functional_low, functional_high, description, clinical_notes, source) VALUES
('TSH', 'Thyroid Stimulating Hormone', 'thyroid', 0.45, 4.5, 'mIU/L', 0.5, 2.0, 'Primary marker for thyroid function', 'Functional range catches subclinical thyroid dysfunction earlier. Values above 2.0 may indicate early thyroid stress.', 'IFM / A4M Guidelines'),
('FREE_T3', 'Free Triiodothyronine', 'thyroid', 2.0, 4.4, 'pg/mL', 3.0, 4.0, 'Active thyroid hormone', 'Optimal free T3 is upper third of conventional range. Low-normal may indicate conversion issues.', 'IFM Guidelines'),
('FREE_T4', 'Free Thyroxine', 'thyroid', 0.82, 1.77, 'ng/dL', 1.0, 1.5, 'Thyroid prohormone', 'Should be evaluated alongside free T3 for conversion ratio assessment.', 'IFM Guidelines'),
('TPO_AB', 'Thyroid Peroxidase Antibodies', 'thyroid', 0, 34, 'IU/mL', 0, 15, 'Autoimmune thyroid marker', 'Any elevation suggests autoimmune thyroid activity. Functional practitioners target <15.', 'A4M / IFM'),
('VITAMIN_D_25OH', 'Vitamin D, 25-Hydroxy', 'nutritional', 30, 100, 'ng/mL', 50, 80, 'Vitamin D status', 'Functional practitioners target 50-80 for optimal immune, bone, and mood function.', 'A4M Guidelines'),
('FERRITIN', 'Ferritin', 'iron', 12, 150, 'ng/mL', 50, 100, 'Iron storage protein', 'Optimal ferritin supports energy and thyroid function. Low-normal is common in fatigued patients.', 'IFM Guidelines'),
('HOMOCYSTEINE', 'Homocysteine', 'methylation', 0, 15, 'µmol/L', 3, 8, 'Methylation and cardiovascular marker', 'Functional range 3-8. Low homocysteine (<3) may indicate impaired glutathione production. Elevated (>8) indicates methylation dysfunction and CVD risk.', 'A4M / Cleveland Clinic FM'),
('HS_CRP', 'High-Sensitivity C-Reactive Protein', 'inflammation', 0, 3.0, 'mg/L', 0, 1.0, 'Systemic inflammation marker', 'Functional target <1.0. Values 1-3 suggest chronic low-grade inflammation.', 'Cleveland Clinic / IFM'),
('FASTING_INSULIN', 'Fasting Insulin', 'metabolic', 2.6, 24.9, 'µIU/mL', 2.0, 7.0, 'Insulin resistance marker', 'Elevated insulin precedes glucose dysregulation by years. Values >7 suggest early insulin resistance.', 'A4M Guidelines'),
('HBA1C', 'Hemoglobin A1c', 'metabolic', 4.0, 5.6, '%', 4.8, 5.3, 'Average blood sugar over 2-3 months', 'Functional range is tighter. Values 5.4-5.6 may indicate early glycemic stress.', 'IFM Guidelines'),
('DHEA_S', 'DHEA-Sulfate', 'hormone', NULL, NULL, 'µg/dL', NULL, NULL, 'Adrenal function marker (age/sex dependent)', 'Optimal levels vary by age and sex. Generally target upper-middle of age-appropriate range.', 'A4M Guidelines'),
('CORTISOL_AM', 'Cortisol, Morning', 'hormone', 6.2, 19.4, 'µg/dL', 10, 15, 'Morning cortisol', 'Optimal AM cortisol indicates healthy HPA axis. Low-normal suggests adrenal insufficiency.', 'A4M / IFM'),
('TOTAL_TESTOSTERONE', 'Total Testosterone', 'hormone', NULL, NULL, 'ng/dL', NULL, NULL, 'Primary androgen (age/sex dependent)', 'Functional ranges for males: 600-900 ng/dL. Females: 40-60 ng/dL. Significantly tighter than conventional.', 'A4M Guidelines'),
('OMEGA_3_INDEX', 'Omega-3 Index', 'nutritional', NULL, NULL, '%', 8, 12, 'EPA+DHA as % of RBC membranes', 'Target >8% for cardiovascular and cognitive protection. Most Americans are 4-5%.', 'A4M / Functional Medicine Research'),
('MAGNESIUM', 'Magnesium', 'nutritional', 1.7, 2.2, 'mg/dL', 2.0, 2.5, 'Serum magnesium level', 'Serum magnesium reflects extracellular stores. Functional range 2.0-2.5. Values below 2.0 may indicate subclinical deficiency even if within conventional range.', 'IFM / A4M Guidelines'),
('MAGNESIUM_RBC', 'Magnesium, RBC', 'nutritional', 4.2, 6.8, 'mg/dL', 5.5, 6.5, 'Intracellular magnesium status', 'RBC magnesium better reflects tissue stores than serum. Optimal is upper range.', 'IFM Guidelines'),
('ZONULIN', 'Zonulin', 'gi', 0, 107, 'ng/mL', 0, 50, 'Intestinal permeability marker', 'Elevated zonulin suggests increased intestinal permeability (leaky gut). Key functional medicine biomarker.', 'IFM / Fasano Research'),
('CALPROTECTIN', 'Fecal Calprotectin', 'gi', 0, 120, 'µg/g', 0, 50, 'GI inflammation marker', 'Functional range tighter than conventional. Values 50-120 may indicate subclinical GI inflammation.', 'IFM Guidelines'),
('HGB', 'Hemoglobin', 'cbc', 12.0, 17.5, 'g/dL', 13.5, 15.5, 'Oxygen-carrying protein in red blood cells', 'Low hemoglobin indicates anemia. Functional range is tighter to catch early iron deficiency or chronic disease.', 'IFM Guidelines'),
('RBC', 'Red Blood Cell Count', 'cbc', 4.0, 5.5, 'M/uL', 4.2, 4.9, 'Red blood cell concentration', 'Evaluate alongside hemoglobin, hematocrit, and MCV for complete picture of red cell status.', 'IFM Guidelines'),
('HCT', 'Hematocrit', 'cbc', 36.0, 51.0, '%', 38.0, 45.0, 'Percentage of blood volume occupied by RBCs', 'Evaluate with hemoglobin. Low values suggest anemia; high values may indicate dehydration or polycythemia.', 'IFM Guidelines'),
('WBC', 'White Blood Cell Count', 'cbc', 3.4, 10.8, 'K/uL', 5.0, 8.0, 'Immune cell count', 'Low WBC may indicate immune suppression. High WBC may indicate infection or chronic inflammation.', 'IFM Guidelines'),
('MCV', 'Mean Corpuscular Volume', 'cbc', 79, 97, 'fL', 82, 92, 'Average red blood cell size', 'High MCV suggests B12/folate deficiency. Low MCV suggests iron deficiency or thalassemia.', 'IFM Guidelines'),
('PLT', 'Platelet Count', 'cbc', 150, 379, 'K/uL', 200, 300, 'Platelet concentration', 'Low platelets may indicate autoimmune destruction or bone marrow issues. High platelets may indicate inflammation.', 'IFM Guidelines'),
('TOTAL_CHOLESTEROL', 'Cholesterol, Total', 'lipid', 100, 199, 'mg/dL', 120, 220, 'Total blood cholesterol', 'Functional range is wider than conventional. Very low cholesterol (<120) may impair hormone synthesis and cell membrane integrity.', 'IFM / A4M Guidelines'),
('LDL', 'LDL Cholesterol', 'lipid', 0, 99, 'mg/dL', 0, 100, 'Low-density lipoprotein', 'Evaluate alongside particle size and inflammation markers. Standard LDL alone is an incomplete risk picture.', 'IFM Guidelines'),
('HDL', 'HDL Cholesterol', 'lipid', 40, 999, 'mg/dL', 60, 999, 'High-density lipoprotein', 'Functional target >60 for cardiovascular protection. Low HDL is an independent CVD risk factor.', 'IFM Guidelines'),
('TRIGLYCERIDES', 'Triglycerides', 'lipid', 0, 149, 'mg/dL', 0, 100, 'Blood triglyceride level', 'Functional target <100. Elevated triglycerides indicate insulin resistance and metabolic dysfunction.', 'IFM / A4M Guidelines')
ON CONFLICT (biomarker_code) DO NOTHING;

-- ===========================================
-- DONE
-- ===========================================
