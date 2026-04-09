-- ══════════════════════════════════════════════════════════════════════════════
-- NISHKRITI — Migration 003: Extend protocols table for full treatment plans
-- ══════════════════════════════════════════════════════════════════════════════

-- ── New columns on protocols ─────────────────────────────────────────────────
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS calorie_target      INTEGER;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS fat_target_g        INTEGER;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exercise_type       TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exercise_duration_min INTEGER DEFAULT 45;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exercise_intensity  TEXT DEFAULT 'moderate';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exercise_frequency  TEXT DEFAULT '5x/week';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exercise_notes      TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS phases              JSONB DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS medications         JSONB DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS supplements         JSONB DEFAULT '[]';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS notes               TEXT;

-- ── RLS: patients can read their own protocol ────────────────────────────────
CREATE POLICY "patients_read_own_protocol" ON protocols
  FOR SELECT USING (
    patient_id = (SELECT id FROM patient_profiles WHERE auth_id = auth.uid())
  );

-- ── Update trigger for updated_at ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_protocol_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protocol_updated
  BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION update_protocol_timestamp();
