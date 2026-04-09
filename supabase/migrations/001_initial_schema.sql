-- ══════════════════════════════════════════════════════════════════════════════
-- NISHKRITI CLINICAL PLATFORM — DATABASE SCHEMA
-- Supabase (PostgreSQL) — Migration 001
-- ══════════════════════════════════════════════════════════════════════════════

-- ── EXTENSIONS ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy search

-- ── TYPES / ENUMS ────────────────────────────────────────────────────────────
CREATE TYPE condition_type AS ENUM (
  'diabetes_t2','pre_diabetes','pcos','hypothyroid','hypertension',
  'obesity','dyslipidemia','ra','gut_ibs','fatty_liver','skin',
  'menopause','gout','stress','sleep','anaemia','testosterone',
  'osteoporosis','post_covid'
);

CREATE TYPE diet_type AS ENUM (
  'keto','low_carb','carb_cycling','high_carb','high_protein',
  'anti_inflammatory','high_probiotic','frozen_carb','calorie_deficit','maintenance'
);

CREATE TYPE sex_type AS ENUM ('male','female','other');

CREATE TYPE severity_type AS ENUM ('positive','low','medium','high','critical');

CREATE TYPE flag_status AS ENUM ('open','reviewing','resolved','escalated');

-- ── DOCTORS ───────────────────────────────────────────────────────────────────
CREATE TABLE doctors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  credential    TEXT,                    -- "MBBS, DNB (Internal Medicine)"
  registration  TEXT,                   -- medical council reg no
  clinic_name   TEXT,
  clinic_city   TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── PATIENT PROFILES ──────────────────────────────────────────────────────────
CREATE TABLE patient_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id             UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_doctor_id  UUID REFERENCES doctors(id),
  full_name           TEXT NOT NULL,
  dob                 DATE NOT NULL,
  sex                 sex_type NOT NULL,
  height_cm           NUMERIC(5,1) NOT NULL,
  weight_kg           NUMERIC(5,1) NOT NULL,
  conditions          condition_type[] NOT NULL DEFAULT '{}',
  primary_condition   condition_type NOT NULL,
  medications         JSONB DEFAULT '[]',    -- [{name, dose, timing}]
  diet_preference     TEXT DEFAULT 'non_veg',
  allergies           TEXT[] DEFAULT '{}',
  disliked_foods      TEXT[] DEFAULT '{}',
  cuisine_preference  TEXT[] DEFAULT '{}',
  cooking_setup       TEXT DEFAULT 'home',
  activity_level      TEXT DEFAULT 'sedentary',
  workout_equipment   TEXT[] DEFAULT '{}',
  workout_location    TEXT[] DEFAULT '{"home"}',
  available_minutes   INTEGER DEFAULT 45,
  preferred_workout_time TEXT DEFAULT 'morning',
  goals               TEXT[] DEFAULT '{}',
  injuries            TEXT[] DEFAULT '{}',
  programme_start_date DATE DEFAULT CURRENT_DATE,
  current_phase       INTEGER DEFAULT 1,
  assigned_diet_type  diet_type DEFAULT 'low_carb',
  -- Baselines
  baseline_fbs        NUMERIC(6,1),
  baseline_hba1c      NUMERIC(4,1),
  baseline_weight     NUMERIC(5,1),
  baseline_waist      NUMERIC(5,1),
  baseline_hip        NUMERIC(5,1),
  -- Meta
  onboarded_at        TIMESTAMPTZ DEFAULT now(),
  last_active_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_patient_doctor ON patient_profiles(assigned_doctor_id);
CREATE INDEX idx_patient_condition ON patient_profiles USING GIN(conditions);

-- ── DAILY CHECK-INS ───────────────────────────────────────────────────────────
CREATE TABLE daily_check_ins (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id          UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  check_in_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  fbs_mg_dl           NUMERIC(6,1),
  weight_kg           NUMERIC(5,1),
  waist_cm            NUMERIC(5,1),
  hip_cm              NUMERIC(5,1),
  energy_level        SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  sleep_hours         NUMERIC(3,1),
  symptoms            TEXT[] DEFAULT '{}',
  adherence_yesterday TEXT CHECK (adherence_yesterday IN ('full','mostly','partial','none')),
  requests            JSONB DEFAULT '{}',
  message_for_doctor  TEXT,
  photo_front_url     TEXT,
  photo_side_url      TEXT,
  photo_back_url      TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (patient_id, check_in_date)
);

CREATE INDEX idx_checkin_patient_date ON daily_check_ins(patient_id, check_in_date DESC);

-- ── GENERATED DAILY PLANS ────────────────────────────────────────────────────
CREATE TABLE daily_plans (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id          UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  check_in_id         UUID REFERENCES daily_check_ins(id),
  plan_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  reasoning           TEXT,
  rules_fired         JSONB DEFAULT '[]',  -- [{ruleId, message, severity}]
  diet_type           diet_type NOT NULL,
  calorie_target      INTEGER,
  carbs_target_g      INTEGER,
  protein_target_g    INTEGER,
  fat_target_g        INTEGER,
  water_target_ml     INTEGER DEFAULT 2000,
  meals               JSONB NOT NULL DEFAULT '[]',
  workout             JSONB NOT NULL DEFAULT '{}',
  supplements         JSONB DEFAULT '[]',
  supplement_note     TEXT,
  -- Doctor oversight
  doctor_flag_raised  BOOLEAN DEFAULT false,
  doctor_flag_reason  TEXT,
  flag_status         flag_status DEFAULT 'open',
  doctor_reviewed_at  TIMESTAMPTZ,
  doctor_note         TEXT,
  status              TEXT DEFAULT 'generated' CHECK (status IN ('generating','generated','approved','overridden')),
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (patient_id, plan_date)
);

CREATE INDEX idx_plan_patient_date   ON daily_plans(patient_id, plan_date DESC);
CREATE INDEX idx_plan_flags          ON daily_plans(doctor_flag_raised, flag_status) WHERE doctor_flag_raised = true;

-- ── PROTOCOLS ─────────────────────────────────────────────────────────────────
CREATE TABLE protocols (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  condition       condition_type NOT NULL,
  current_phase   INTEGER DEFAULT 1,
  phase_name      TEXT,
  diet_type       diet_type DEFAULT 'low_carb',
  carbs_target_g  INTEGER DEFAULT 70,
  protein_target_g INTEGER DEFAULT 100,
  calorie_deficit INTEGER DEFAULT 350,
  fbs_green_min   INTEGER DEFAULT 70,
  fbs_green_max   INTEGER DEFAULT 100,
  fbs_amber_max   INTEGER DEFAULT 130,
  fbs_act_max     INTEGER DEFAULT 180,
  custom_rules    JSONB DEFAULT '{}',
  techniques      JSONB DEFAULT '{"frozen_carb": true, "fat_only_day": false, "carb_cycling": false}',
  is_active       BOOLEAN DEFAULT true,
  doctor_id       UUID REFERENCES doctors(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_protocol_patient ON protocols(patient_id) WHERE is_active = true;

-- ── PROGRESS ENTRIES ──────────────────────────────────────────────────────────
CREATE TABLE progress_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   NUMERIC(5,1),
  waist_cm    NUMERIC(5,1),
  hip_cm      NUMERIC(5,1),
  neck_cm     NUMERIC(5,1),
  chest_cm    NUMERIC(5,1),
  thigh_l_cm  NUMERIC(5,1),
  bicep_l_cm  NUMERIC(5,1),
  fbs_mg_dl   NUMERIC(6,1),
  bmi         NUMERIC(4,1),
  body_fat_pct NUMERIC(4,1),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (patient_id, entry_date)
);

-- ── SUPPLEMENTS ───────────────────────────────────────────────────────────────
CREATE TABLE patient_supplements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  dose            TEXT,
  timing          TEXT,
  with_food       TEXT,
  patient_reason  TEXT,
  is_active       BOOLEAN DEFAULT true,
  prescribed_by   UUID REFERENCES doctors(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── SUPPLEMENT LOGS ───────────────────────────────────────────────────────────
CREATE TABLE supplement_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES patient_supplements(id),
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  taken       BOOLEAN DEFAULT false,
  taken_at    TIMESTAMPTZ,
  UNIQUE (supplement_id, log_date)
);

-- ── DOCTOR MESSAGES ───────────────────────────────────────────────────────────
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES doctors(id),
  sender_role     TEXT NOT NULL CHECK (sender_role IN ('patient','doctor','system')),
  urgency         TEXT DEFAULT 'normal' CHECK (urgency IN ('normal','question','urgent','critical')),
  body            TEXT NOT NULL,
  vitals_snapshot JSONB,  -- {fbs, weight, energy} auto-attached from latest check-in
  attachments     TEXT[], -- photo URLs
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_patient ON messages(patient_id, created_at DESC);
CREATE INDEX idx_messages_doctor  ON messages(doctor_id, created_at DESC);

-- ── BIOMARKER HISTORY (LAB RESULTS) ──────────────────────────────────────────
CREATE TABLE lab_results (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  test_date   DATE NOT NULL,
  hba1c       NUMERIC(4,1),
  fasting_insulin NUMERIC(6,1),
  tsh         NUMERIC(6,2),
  t3_free     NUMERIC(6,2),
  t4_free     NUMERIC(6,2),
  lh          NUMERIC(6,2),
  fsh         NUMERIC(6,2),
  testosterone_free NUMERIC(8,2),
  vitamin_d   NUMERIC(6,1),
  vitamin_b12 NUMERIC(6,0),
  iron        NUMERIC(6,1),
  ferritin    NUMERIC(6,1),
  cholesterol_total NUMERIC(6,1),
  ldl         NUMERIC(6,1),
  hdl         NUMERIC(6,1),
  triglycerides NUMERIC(6,1),
  uric_acid   NUMERIC(5,2),
  creatinine  NUMERIC(5,2),
  alt         NUMERIC(6,1),
  ast         NUMERIC(6,1),
  raw_report_url TEXT,
  notes       TEXT,
  entered_by  TEXT DEFAULT 'patient',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── PLAN AUDIT LOG ────────────────────────────────────────────────────────────
CREATE TABLE plan_audit (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id     UUID REFERENCES daily_plans(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL,
  action      TEXT NOT NULL,  -- 'generated','doctor_approved','doctor_overridden','patient_viewed'
  actor_id    UUID,
  actor_role  TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE patient_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols            ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_supplements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results          ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own data
CREATE POLICY "patients_own_profile" ON patient_profiles
  FOR ALL USING (auth.uid() = auth_id);

CREATE POLICY "patients_own_checkins" ON daily_check_ins
  FOR ALL USING (
    patient_id = (SELECT id FROM patient_profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "patients_own_plans" ON daily_plans
  FOR ALL USING (
    patient_id = (SELECT id FROM patient_profiles WHERE auth_id = auth.uid())
  );

-- Doctors can see all patients assigned to them
CREATE POLICY "doctors_see_assigned_patients" ON patient_profiles
  FOR SELECT USING (
    assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
  );

CREATE POLICY "doctors_see_patient_checkins" ON daily_check_ins
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "doctors_see_patient_plans" ON daily_plans
  FOR ALL USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "doctors_see_protocols" ON protocols
  FOR ALL USING (
    doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
    OR patient_id IN (
      SELECT id FROM patient_profiles
      WHERE assigned_doctor_id = (SELECT id FROM doctors WHERE auth_id = auth.uid())
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

-- Auto-create progress entry from check-in
CREATE OR REPLACE FUNCTION sync_progress_from_checkin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO progress_entries (patient_id, entry_date, weight_kg, waist_cm, hip_cm, fbs_mg_dl)
  VALUES (NEW.patient_id, NEW.check_in_date, NEW.weight_kg, NEW.waist_cm, NEW.hip_cm, NEW.fbs_mg_dl)
  ON CONFLICT (patient_id, entry_date) DO UPDATE SET
    weight_kg = EXCLUDED.weight_kg,
    waist_cm  = EXCLUDED.waist_cm,
    hip_cm    = EXCLUDED.hip_cm,
    fbs_mg_dl = EXCLUDED.fbs_mg_dl;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_progress
  AFTER INSERT OR UPDATE ON daily_check_ins
  FOR EACH ROW EXECUTE FUNCTION sync_progress_from_checkin();

-- Update last_active_at on check-in
CREATE OR REPLACE FUNCTION update_patient_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE patient_profiles SET last_active_at = now() WHERE id = NEW.patient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_last_active
  AFTER INSERT ON daily_check_ins
  FOR EACH ROW EXECUTE FUNCTION update_patient_last_active();

-- Auto-log plan audit
CREATE OR REPLACE FUNCTION log_plan_generation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO plan_audit (plan_id, patient_id, action, details, actor_role)
  VALUES (NEW.id, NEW.patient_id, 'generated', jsonb_build_object('diet_type', NEW.diet_type, 'rules_fired', array_length(NEW.rules_fired::jsonb[], 1)), 'system');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plan_audit
  AFTER INSERT ON daily_plans
  FOR EACH ROW EXECUTE FUNCTION log_plan_generation();

-- ══════════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ══════════════════════════════════════════════════════════════════════════════

-- Doctor dashboard view — one row per patient, latest vitals
CREATE OR REPLACE VIEW doctor_patient_summary AS
SELECT
  pp.id,
  pp.full_name,
  pp.primary_condition,
  pp.current_phase,
  pp.assigned_doctor_id,
  pp.programme_start_date,
  CURRENT_DATE - pp.programme_start_date AS days_in_programme,
  -- Latest check-in
  ci.check_in_date   AS last_checkin_date,
  ci.fbs_mg_dl       AS latest_fbs,
  ci.weight_kg       AS latest_weight,
  ci.energy_level    AS latest_energy,
  -- Latest plan flags
  dp.doctor_flag_raised,
  dp.doctor_flag_reason,
  dp.flag_status,
  -- 7-day avg FBS
  (
    SELECT ROUND(AVG(fbs_mg_dl), 0)
    FROM daily_check_ins c2
    WHERE c2.patient_id = pp.id
      AND c2.check_in_date >= CURRENT_DATE - INTERVAL '7 days'
      AND c2.fbs_mg_dl IS NOT NULL
  ) AS avg_fbs_7d,
  -- Adherence (days checked in last 14)
  (
    SELECT COUNT(*)
    FROM daily_check_ins c3
    WHERE c3.patient_id = pp.id
      AND c3.check_in_date >= CURRENT_DATE - INTERVAL '14 days'
  ) * 100 / 14 AS adherence_pct_14d
FROM patient_profiles pp
LEFT JOIN LATERAL (
  SELECT * FROM daily_check_ins c
  WHERE c.patient_id = pp.id
  ORDER BY c.check_in_date DESC
  LIMIT 1
) ci ON true
LEFT JOIN LATERAL (
  SELECT * FROM daily_plans d
  WHERE d.patient_id = pp.id
  ORDER BY d.plan_date DESC
  LIMIT 1
) dp ON true;

-- Patient progress trend (last 30 days FBS)
CREATE OR REPLACE VIEW patient_fbs_trend AS
SELECT
  patient_id,
  check_in_date,
  fbs_mg_dl,
  AVG(fbs_mg_dl) OVER (
    PARTITION BY patient_id
    ORDER BY check_in_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS fbs_7day_rolling_avg
FROM daily_check_ins
WHERE fbs_mg_dl IS NOT NULL
ORDER BY patient_id, check_in_date;

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Dr. Nishit's account
-- ══════════════════════════════════════════════════════════════════════════════
-- Run this after creating the auth user in Supabase dashboard
-- INSERT INTO doctors (auth_id, full_name, credential, clinic_name, clinic_city)
-- VALUES ('<AUTH_UUID_FROM_SUPABASE>', 'Dr. Nishit', 'MBBS, MD (Internal Medicine)', 'Nishkriti Clinic', 'Mumbai');
