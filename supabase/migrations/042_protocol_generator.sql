-- ============================================================
-- Migration 042: Protocol Generator Pro (Pro+ Tier)
-- Multi-phase AI-generated treatment protocols
-- ============================================================

-- 1. treatment_protocols
CREATE TABLE treatment_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  focus_areas TEXT[] DEFAULT '{}',
  total_duration_weeks INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  generation_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatment_protocols_patient ON treatment_protocols(patient_id);
CREATE INDEX idx_treatment_protocols_practitioner ON treatment_protocols(practitioner_id);
CREATE INDEX idx_treatment_protocols_status ON treatment_protocols(status);

-- 2. protocol_phases
CREATE TABLE protocol_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES treatment_protocols(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'extended', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  supplements JSONB NOT NULL DEFAULT '[]',
  diet JSONB DEFAULT '[]',
  lifestyle JSONB DEFAULT '[]',
  labs_to_order JSONB DEFAULT '[]',
  conditional_logic JSONB DEFAULT '[]',
  practitioner_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_protocol_phases_protocol ON protocol_phases(protocol_id, phase_number);

-- 3. protocol_phase_supplements (normalized for querying/reporting)
CREATE TABLE protocol_phase_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES protocol_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  timing TEXT,
  rationale TEXT,
  rag_source TEXT,
  rag_citations JSONB DEFAULT '[]',
  action TEXT NOT NULL DEFAULT 'start' CHECK (action IN ('start', 'continue', 'increase', 'decrease', 'discontinue')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_phase_supplements_phase ON protocol_phase_supplements(phase_id);

-- 4. protocol_progress
CREATE TABLE protocol_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES treatment_protocols(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES protocol_phases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('phase_started', 'phase_completed', 'phase_extended', 'lab_result', 'symptom_checkin', 'practitioner_note')),
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  detail JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_protocol_progress_protocol ON protocol_progress(protocol_id, event_date DESC);

-- 5. RLS policies
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_phase_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practitioner_own_protocols" ON treatment_protocols
  FOR ALL USING (
    practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "practitioner_own_phases" ON protocol_phases
  FOR ALL USING (
    protocol_id IN (
      SELECT id FROM treatment_protocols
      WHERE practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "practitioner_own_phase_supplements" ON protocol_phase_supplements
  FOR ALL USING (
    phase_id IN (
      SELECT pp.id FROM protocol_phases pp
      JOIN treatment_protocols tp ON pp.protocol_id = tp.id
      WHERE tp.practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "practitioner_own_progress" ON protocol_progress
  FOR ALL USING (
    protocol_id IN (
      SELECT id FROM treatment_protocols
      WHERE practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
    )
  );

-- 6. Updated_at triggers
CREATE TRIGGER set_updated_at_treatment_protocols
  BEFORE UPDATE ON treatment_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_protocol_phases
  BEFORE UPDATE ON protocol_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
