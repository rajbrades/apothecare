-- ===========================================
-- APOTHECARE - Supplement Intelligence Module
-- ===========================================
-- Sprint 6: AI-powered supplement reviews, interaction checking, brand formulary

-- ── New Enums ──────────────────────────────────────────────────────────

CREATE TYPE supplement_review_status AS ENUM (
  'pending', 'generating', 'complete', 'error'
);

CREATE TYPE interaction_severity AS ENUM (
  'critical', 'caution', 'safe', 'unknown'
);

CREATE TYPE supplement_action AS ENUM (
  'keep', 'modify', 'discontinue', 'add'
);

-- ── Supplement Reviews ─────────────────────────────────────────────────

CREATE TABLE supplement_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status supplement_review_status DEFAULT 'pending',
  review_data JSONB DEFAULT '{}',
  raw_ai_text TEXT,
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplement_reviews_practitioner ON supplement_reviews(practitioner_id);
CREATE INDEX idx_supplement_reviews_patient ON supplement_reviews(patient_id);
CREATE INDEX idx_supplement_reviews_created ON supplement_reviews(created_at DESC);

ALTER TABLE supplement_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplement_reviews_own_data" ON supplement_reviews
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

CREATE TRIGGER set_supplement_reviews_updated_at
  BEFORE UPDATE ON supplement_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Interaction Checks ─────────────────────────────────────────────────

CREATE TABLE interaction_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  supplements_input TEXT NOT NULL,
  medications_input TEXT DEFAULT '',
  result_data JSONB DEFAULT '{}',
  raw_ai_text TEXT,
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interaction_checks_practitioner ON interaction_checks(practitioner_id);
CREATE INDEX idx_interaction_checks_created ON interaction_checks(created_at DESC);

ALTER TABLE interaction_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interaction_checks_own_data" ON interaction_checks
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- ── Practitioner Brand Preferences ─────────────────────────────────────

CREATE TABLE practitioner_brand_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practitioner_id, brand_name)
);

CREATE INDEX idx_brand_prefs_practitioner ON practitioner_brand_preferences(practitioner_id);

ALTER TABLE practitioner_brand_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_preferences_own_data" ON practitioner_brand_preferences
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

CREATE TRIGGER set_brand_prefs_updated_at
  BEFORE UPDATE ON practitioner_brand_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
