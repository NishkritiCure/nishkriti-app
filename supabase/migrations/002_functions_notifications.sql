-- ══════════════════════════════════════════════════════════════════════════════
-- NISHKRITI — Migration 002
-- Missing tables, indexes, notification tokens, edge function hooks
-- ══════════════════════════════════════════════════════════════════════════════

-- ── PLAN AUDIT TABLE (referenced in migration 001 trigger) ────────────────────
CREATE TABLE IF NOT EXISTS plan_audit (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id     UUID REFERENCES daily_plans(id) ON DELETE CASCADE,
  patient_id  UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,  -- 'generated' | 'doctor_override' | 'approved' | 'rejected'
  details     JSONB,
  actor_role  TEXT NOT NULL,  -- 'system' | 'doctor' | 'patient'
  actor_id    UUID,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE plan_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors_see_audit" ON plan_audit
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
    )
  );

-- ── PUSH NOTIFICATION TOKENS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_token  TEXT NOT NULL,
  platform    TEXT,           -- 'ios' | 'android'
  device_id   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_tokens" ON push_tokens
  FOR ALL USING (auth.uid() = auth_id);

-- ── ONBOARDING STATE ──────────────────────────────────────────────────────────
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activation_date       DATE,
  ADD COLUMN IF NOT EXISTS programme_end_date    DATE;

-- ── SUPPLEMENT LOGS (track per-day taken/not) ─────────────────────────────────
ALTER TABLE supplement_logs
  ADD COLUMN IF NOT EXISTS note TEXT;

CREATE POLICY "patients_own_supplement_logs" ON supplement_logs
  FOR ALL USING (
    patient_id = (SELECT id FROM patient_profiles WHERE auth_id = auth.uid())
  );

-- ── MESSAGES RLS (complete) ───────────────────────────────────────────────────
CREATE POLICY "patients_own_messages" ON messages
  FOR ALL USING (
    patient_id = (SELECT id FROM patient_profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "doctors_see_assigned_messages" ON messages
  FOR ALL USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
    )
  );

-- ── LAB RESULTS RLS ───────────────────────────────────────────────────────────
CREATE POLICY "patients_own_labs" ON lab_results
  FOR ALL USING (
    patient_id = (SELECT id FROM patient_profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "doctors_see_patient_labs" ON lab_results
  FOR ALL USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
    )
  );

-- ── DOCTOR WRITE POLICIES ─────────────────────────────────────────────────────
-- Doctors can override and approve plans
CREATE POLICY "doctors_update_patient_plans" ON daily_plans
  FOR UPDATE USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
    )
  );

-- Doctors can update patient profiles
CREATE POLICY "doctors_update_patient_profile" ON patient_profiles
  FOR UPDATE USING (
    assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
  );

-- Doctors can write protocols
CREATE POLICY "doctors_write_protocols" ON protocols
  FOR INSERT WITH CHECK (
    doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
  );

-- ── PERFORMANCE INDEXES ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_checkins_patient_date
  ON daily_check_ins(patient_id, check_in_date DESC);

CREATE INDEX IF NOT EXISTS idx_plans_patient_date
  ON daily_plans(patient_id, plan_date DESC);

CREATE INDEX IF NOT EXISTS idx_progress_patient_date
  ON progress_entries(patient_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_messages_patient_created
  ON messages(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_doctor
  ON patient_profiles(assigned_doctor_id);

CREATE INDEX IF NOT EXISTS idx_plan_audit_patient
  ON plan_audit(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_condition
  ON patient_profiles(primary_condition);

-- ── FUNCTION: get_doctor_dashboard ───────────────────────────────────────────
-- Returns all patients for a doctor with today's status in one query
CREATE OR REPLACE FUNCTION get_doctor_dashboard(doctor_auth_id UUID)
RETURNS TABLE (
  patient_id           UUID,
  full_name            TEXT,
  primary_condition    TEXT,
  current_phase        INT,
  days_in_programme    INT,
  latest_fbs           INT,
  latest_weight        NUMERIC,
  latest_energy        INT,
  avg_fbs_7d           INT,
  adherence_pct        INT,
  doctor_flag_raised   BOOLEAN,
  doctor_flag_reason   TEXT,
  unread_messages      BIGINT
) AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  SELECT id INTO v_doctor_id FROM doctors WHERE auth_id = doctor_auth_id;

  RETURN QUERY
  SELECT
    pp.id,
    pp.full_name,
    pp.primary_condition::TEXT,
    pp.current_phase,
    (CURRENT_DATE - pp.programme_start_date)::INT,
    ci.fbs_mg_dl,
    ci.weight_kg,
    ci.energy_level,
    COALESCE((
      SELECT ROUND(AVG(fbs_mg_dl))::INT FROM daily_check_ins c
      WHERE c.patient_id = pp.id AND c.check_in_date >= CURRENT_DATE - 7
    ), 0),
    COALESCE((
      SELECT COUNT(*)::INT * 100 / 14 FROM daily_check_ins c
      WHERE c.patient_id = pp.id AND c.check_in_date >= CURRENT_DATE - 14
    ), 0),
    dp.doctor_flag_raised,
    dp.doctor_flag_reason,
    (SELECT COUNT(*) FROM messages m WHERE m.patient_id = pp.id AND m.read_by_doctor = false)
  FROM patient_profiles pp
  LEFT JOIN LATERAL (
    SELECT * FROM daily_check_ins c WHERE c.patient_id = pp.id
    ORDER BY c.check_in_date DESC LIMIT 1
  ) ci ON true
  LEFT JOIN LATERAL (
    SELECT * FROM daily_plans d WHERE d.patient_id = pp.id
    ORDER BY d.plan_date DESC LIMIT 1
  ) dp ON true
  WHERE pp.assigned_doctor_id = v_doctor_id
  ORDER BY dp.doctor_flag_raised DESC NULLS LAST, ci.fbs_mg_dl DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FUNCTION: flag_plan_for_doctor ────────────────────────────────────────────
-- Called by app when rules fire notifyDoctor=true
CREATE OR REPLACE FUNCTION flag_plan_for_doctor(
  p_plan_id     UUID,
  p_reason      TEXT,
  p_severity    TEXT DEFAULT 'high'
)
RETURNS VOID AS $$
BEGIN
  UPDATE daily_plans SET
    doctor_flag_raised = true,
    doctor_flag_reason = p_reason,
    flag_status = 'open'
  WHERE id = p_plan_id;

  INSERT INTO plan_audit(plan_id, patient_id, action, details, actor_role)
  SELECT p_plan_id, patient_id,
    'flagged',
    jsonb_build_object('reason', p_reason, 'severity', p_severity),
    'system'
  FROM daily_plans WHERE id = p_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FUNCTION: doctor_approve_plan ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION doctor_approve_plan(
  p_plan_id      UUID,
  p_doctor_note  TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  SELECT id INTO v_doctor_id FROM doctors WHERE auth_id = auth.uid();

  UPDATE daily_plans SET
    flag_status = 'resolved',
    doctor_approved = true,
    doctor_note = p_doctor_note,
    doctor_reviewed_at = now()
  WHERE id = p_plan_id;

  INSERT INTO plan_audit(plan_id, patient_id, action, details, actor_role, actor_id)
  SELECT p_plan_id, patient_id,
    'approved',
    jsonb_build_object('doctor_note', p_doctor_note),
    'doctor', v_doctor_id
  FROM daily_plans WHERE id = p_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FUNCTION: get_patient_fbs_history ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_patient_fbs_history(
  p_patient_id UUID,
  p_days       INT DEFAULT 30
)
RETURNS TABLE (
  check_in_date  DATE,
  fbs_mg_dl      INT,
  rolling_avg_7d NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.check_in_date,
    c.fbs_mg_dl,
    AVG(c.fbs_mg_dl) OVER (
      ORDER BY c.check_in_date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    )::NUMERIC(6,1)
  FROM daily_check_ins c
  WHERE c.patient_id = p_patient_id
    AND c.check_in_date >= CURRENT_DATE - p_days
    AND c.fbs_mg_dl IS NOT NULL
  ORDER BY c.check_in_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FUNCTION: send_push_notification (via edge function) ─────────────────────
-- This is called from database triggers to queue push notifications
-- The actual sending happens in a Supabase Edge Function
CREATE TABLE IF NOT EXISTS notification_queue (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_auth_id UUID REFERENCES auth.users(id),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  data         JSONB,
  sent         BOOLEAN DEFAULT false,
  send_after   TIMESTAMPTZ DEFAULT now(),
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Queue notification when doctor flag is raised
CREATE OR REPLACE FUNCTION queue_flag_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_doctor_auth_id UUID;
  v_patient_name   TEXT;
BEGIN
  IF NEW.doctor_flag_raised = true AND (OLD.doctor_flag_raised IS DISTINCT FROM true) THEN
    -- Get doctor's auth_id
    SELECT d.auth_id, pp.full_name
    INTO v_doctor_auth_id, v_patient_name
    FROM patient_profiles pp
    JOIN doctors d ON d.id = pp.assigned_doctor_id
    WHERE pp.id = NEW.patient_id;

    IF v_doctor_auth_id IS NOT NULL THEN
      INSERT INTO notification_queue(recipient_auth_id, title, body, data)
      VALUES (
        v_doctor_auth_id,
        'Patient flag — review needed',
        v_patient_name || ': ' || COALESCE(NEW.doctor_flag_reason, 'Review required'),
        jsonb_build_object(
          'type', 'doctor_flag',
          'patient_id', NEW.patient_id,
          'plan_id', NEW.id
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flag_notification
  AFTER UPDATE ON daily_plans
  FOR EACH ROW EXECUTE FUNCTION queue_flag_notification();

-- Queue notification when plan is ready for patient
CREATE OR REPLACE FUNCTION queue_plan_ready_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_auth_id UUID;
BEGIN
  SELECT auth_id INTO v_patient_auth_id
  FROM patient_profiles WHERE id = NEW.patient_id;

  IF v_patient_auth_id IS NOT NULL THEN
    INSERT INTO notification_queue(recipient_auth_id, title, body, data)
    VALUES (
      v_patient_auth_id,
      'Your plan is ready ✅',
      'Good morning. Your personalised plan for today is ready.',
      jsonb_build_object('type', 'plan_ready', 'plan_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plan_ready_notification
  AFTER INSERT ON daily_plans
  FOR EACH ROW EXECUTE FUNCTION queue_plan_ready_notification();

