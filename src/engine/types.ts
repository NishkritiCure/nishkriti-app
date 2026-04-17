/**
 * Nishkriti fallback engine — canonical type surface.
 *
 * See documents/APP-ENGINE-CONTEXT.md for algorithm semantics,
 * documents/specs/MOCK-DATA-SPEC.md §POST /v1/daily-plans/fallback-submit
 * for the wire contract this module must match, and
 * backend/db/migrations/001_unified_phase1.sql for the canonical column
 * names used throughout.
 */

// ─── Domain primitives ──────────────────────────────────────────────────────

export type ConditionType =
  | 'diabetes_t2'
  | 'pcos'
  | 'hypothyroid'
  | 'hypertension'
  | 'obesity'
  | 'dyslipidemia'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export type Sex = 'male' | 'female' | 'other'

export type DietPreference = 'veg' | 'non_veg' | 'egg' | 'vegan' | 'jain'

export type DietType =
  | 'low_carb'
  | 'keto'
  | 'high_protein'
  | 'maintenance'
  | 'anti_inflammatory'
  | 'calorie_deficit'
  | 'carb_cycling'
  | 'high_carb'
  | 'high_probiotic'
  | 'frozen_carb'

export type MealSlot =
  | 'early_morning'
  | 'breakfast'
  | 'mid_morning'
  | 'lunch'
  | 'evening'
  | 'dinner'

export type WorkoutLocation = 'home' | 'gym' | 'outdoor'

export type WorkoutIntensity = 'rest' | 'light' | 'moderate' | 'high'

export type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'balance'

export type GlycemicIndex = 'low' | 'medium' | 'high'

export type Severity = 'positive' | 'low' | 'medium' | 'high' | 'critical'

export type AdherenceLevel = 'low' | 'medium' | 'high' | 'perfect'

// ─── Rule shape (interpreted from engine_base_versions.content_json) ────────

export type RuleMetric =
  | 'fbs'
  | 'weight'
  | 'energy'
  | 'sleep'
  | 'tsh'
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'lipid_panel'
  | 'hba1c'
  | 'cycle'
  | 'adherence'
  | 'post_meal_walks_missed'
  | 'medication_missed'

export type RuleOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'eq'

export type RuleDataSource = 'check_in' | 'lab_integration' | 'wearable' | 'cycle_tracking'

export interface DietAction {
  type: 'carb_delta' | 'diet_type_override' | 'meal_swap' | 'note'
  value_g?: number
  diet_type?: DietType
  swap_from?: string
  swap_to?: string
  text?: string
}

export interface WorkoutAction {
  type: 'intensity_cap' | 'duration_cap' | 'rest_day' | 'post_meal_walk' | 'note'
  intensity?: WorkoutIntensity
  minutes?: number
  after?: 'lunch' | 'dinner'
  reason?: string
  text?: string
}

export interface ProtocolRule {
  id: string
  condition: ConditionType | 'global'
  metric: RuleMetric
  operator: RuleOperator
  threshold: number | readonly [number, number]
  window_days: number
  severity: Severity
  notify_doctor: boolean
  diet_actions: readonly DietAction[]
  workout_actions: readonly WorkoutAction[]
  reasoning_template: string
  data_source: RuleDataSource
}

// ─── Engine layer content ───────────────────────────────────────────────────

export interface FbsBands {
  hypo: number
  target: readonly [number, number]
  amber: readonly [number, number]
  elevated: readonly [number, number]
  high: readonly [number, number]
  critical: number
}

export interface CarbAdjustments {
  REDUCTION_HIGH_FBS_G: number
  CRITICAL_FLOOR_G: number
  INCREASE_HYPO_G: number
  INCREASE_FATIGUE_G: number
  ABSOLUTE_MIN_G: number
}

export interface MacroSplit {
  carbs: number
  protein: number
  fat: number
}

export interface WaterConfig {
  base_ml: number
  fbs_elevated_bonus_ml: number
  high_energy_bonus_ml: number
  hypertension_bonus_ml: number
}

export interface PostMealWalksConfig {
  fbs_elevated_threshold: number
  fbs_high_threshold: number
  durations_min: {
    after_lunch: number
    after_dinner: number
  }
}

export interface EngineLayerContent {
  meal_slots: readonly MealSlot[]
  macro_defaults: Record<string, unknown>
  biomarker_defaults: {
    fbs: FbsBands
    [k: string]: unknown
  }
  rules: readonly ProtocolRule[]
  carb_adjustments: CarbAdjustments
  macro_splits: Record<DietType, MacroSplit>
  water: WaterConfig
  post_meal_walks: PostMealWalksConfig
}

export interface EngineBaseVersion {
  id: string
  version: number
  content_json: EngineLayerContent
}

/** Overlay content is a partial of EngineLayerContent — only overridden fields appear. */
export type EngineOverlayContent = Partial<EngineLayerContent>

export interface EngineConditionOverlay {
  id: string
  condition: ConditionType
  version: number
  content_json: EngineOverlayContent
}

export interface PatientEngineOverride {
  id: string
  patient_id: string
  version: number
  content_json: EngineOverlayContent
}

/**
 * Pointer row — which versions apply to this patient. Read first by the engine
 * so the snapshot of version IDs flows into the emitted plan for audit.
 */
export interface EngineActiveLayers {
  patient_id: string
  base_version_id: string
  condition_overlay_version_ids: readonly string[]
  override_version_id: string | null
}

/**
 * Output of engineConfig.mergeEngineLayers. Carries the merged effective rules
 * AND the source version IDs so adaptiveEngine.generate can emit
 * engine_version_snapshot alongside the plan (required by phase-d's
 * fallback-submit request).
 */
export interface MergedRules {
  content: EngineLayerContent
  version_snapshot: {
    base_version_id: string
    condition_overlay_version_ids: readonly string[]
    override_version_id: string | null
  }
}

// ─── Patient / protocol / check-in domain ───────────────────────────────────

export interface Patient {
  id: string
  dob: string // ISO date
  sex: Sex
  height_cm: number
  weight_kg: number
  activity_level: ActivityLevel
  conditions: readonly ConditionType[]
  primary_condition: ConditionType
  diet_preference: DietPreference
  cuisine_preference: readonly string[]
  allergies: readonly string[]
  disliked_foods: readonly string[]
  workout_location: readonly WorkoutLocation[]
  workout_equipment: readonly string[]
  injuries: readonly string[]
}

export interface Protocol {
  id: string
  patient_id: string
  condition: ConditionType
  diet_type: DietType
  calorie_target: number | null
  carbs_target_g: number | null
  protein_target_g: number | null
  fat_target_g: number | null
  water_target_ml: number | null
}

export interface DailyCheckInRequests {
  dietType?: DietType
  cuisineRequest?: string
  skipMeal?: MealSlot
  eatingOut?: boolean
  travelDay?: boolean
  workoutLocation?: WorkoutLocation
  workoutFocus?: 'core' | 'upper' | 'lower' | 'full'
  workoutMinutes?: number
  lightDinner?: boolean
}

export interface DailyCheckIn {
  id: string
  patient_id: string
  check_in_date: string // YYYY-MM-DD
  fbs_mg_dl: number | null
  weight_kg: number | null
  waist_cm: number | null
  hip_cm: number | null
  energy_level: number | null // 1..5
  sleep_hours: number | null
  symptoms: readonly string[]
  adherence_yesterday: AdherenceLevel | null
  requests: DailyCheckInRequests | null
  message_for_doctor: string | null
}

export interface LabResult {
  id: string
  patient_id: string
  collected_on: string
  tsh: number | null
  hba1c: number | null
  ldl: number | null
  hdl: number | null
  triglycerides: number | null
}

export interface Vital {
  id: string
  patient_id: string
  recorded_at: string
  metric_type: 'blood_pressure' | 'heart_rate' | 'spo2' | 'post_meal_glucose' | 'fasting_glucose'
  value_primary: number // e.g. systolic for BP, glucose value, etc.
  value_secondary: number | null // e.g. diastolic
}

export interface MenstrualCycle {
  id: string
  patient_id: string
  cycle_start_date: string
  cycle_length_days: number | null
  flow_level: 'none' | 'light' | 'medium' | 'heavy' | null
}

export interface PatientSupplement {
  id: string
  patient_id: string
  supplement_library_id: string
  name: string
  dose: string
  timing: string
  with_food: 'yes' | 'no' | 'optional'
  is_active: boolean
}

// ─── Library row types (match 001_unified_phase1.sql §8.1–8.3 exactly) ──────

export interface MealMacros {
  carbs: number
  protein: number
  fat: number
  fibre: number
}

export interface MealIngredient {
  name: string
  grams?: number
  measure?: string
  highlight?: boolean
}

export interface MealLibraryRow {
  id: string
  external_id: string
  name: string
  cuisine: string | null
  diet_types: readonly DietType[]
  is_veg: boolean
  is_egg: boolean
  has_dairy: boolean
  calories: number
  macros: MealMacros
  gi: GlycemicIndex | null
  ingredients: readonly MealIngredient[]
  prep_note: string | null
  portability: 'low' | 'medium' | 'high' | null
  slots: readonly MealSlot[]
}

export interface ExerciseLibraryRow {
  id: string
  external_id: string
  name: string
  category: ExerciseCategory
  muscle_groups: readonly string[]
  equipment_required: readonly string[]
  difficulty: number // 1..5
  instructions: readonly string[]
  duration_default_min: number | null
  video_url: string | null
  locations: readonly WorkoutLocation[]
  contraindications: readonly string[]
}

export interface SupplementLibraryRow {
  id: string
  external_id: string
  name: string
  purpose: string | null
  typical_dose: string | null
  timing_default: string | null
  with_food: 'yes' | 'no' | 'optional' | null
  contraindications: readonly string[]
  evidence_level: string | null
}

// ─── Engine inputs & intermediate shapes ────────────────────────────────────

export interface EngineInputs {
  patient: Patient
  protocol: Protocol
  check_in: DailyCheckIn
  recent_check_ins: readonly DailyCheckIn[]
  recent_labs: readonly LabResult[]
  recent_vitals: readonly Vital[]
  recent_cycles: readonly MenstrualCycle[]
  patient_supplements: readonly PatientSupplement[]
  active_layers: EngineActiveLayers
  base_version: EngineBaseVersion
  condition_overlays: readonly EngineConditionOverlay[]
  patient_override: PatientEngineOverride | null
  libraries: {
    meals: readonly MealLibraryRow[]
    exercises: readonly ExerciseLibraryRow[]
    supplements: readonly SupplementLibraryRow[]
  }
  /** Injected clock — tests freeze it, runtime passes new Date(). */
  now: Date
}

export interface Macros {
  calorie_target: number
  carbs_target_g: number
  protein_target_g: number
  fat_target_g: number
}

export interface FiredRule {
  rule_id: string
  severity: Severity
  notify_doctor: boolean
  message: string
  diet_actions: readonly DietAction[]
  workout_actions: readonly WorkoutAction[]
}

export interface RuleEvaluationContext {
  patient: Patient
  check_in: DailyCheckIn
  recent_check_ins: readonly DailyCheckIn[]
  recent_labs: readonly LabResult[]
  recent_vitals: readonly Vital[]
  recent_cycles: readonly MenstrualCycle[]
  now: Date
}

// ─── Output shapes (match MOCK-DATA-SPEC fallback-submit plan body) ─────────

export interface MealPlanEntry {
  slot: MealSlot
  item: MealLibraryRow
  adjustments?: string
}

export interface PostMealWalk {
  after: 'lunch' | 'dinner'
  minutes: number
  reason: string
}

export interface WorkoutPlan {
  type: string
  duration_min: number
  intensity: WorkoutIntensity
  exercises: readonly ExerciseLibraryRow[]
  post_meal_walks: readonly PostMealWalk[]
}

export interface SupplementPlan {
  supplement_id: string
  name: string
  dose: string
  timing: string
  with_food: 'yes' | 'no' | 'optional'
  reason?: string
}

/**
 * The `plan` body of POST /v1/daily-plans/fallback-submit.
 * See documents/specs/MOCK-DATA-SPEC.md — this shape is the wire contract
 * between the engine and the backend. Drift here means phase-D has to patch.
 */
export interface GeneratedPlan {
  diet_type: DietType
  calorie_target: number
  carbs_target_g: number
  protein_target_g: number
  fat_target_g: number
  water_target_ml: number
  meals: readonly MealPlanEntry[]
  workout: WorkoutPlan
  supplements: readonly SupplementPlan[]
  supplement_note: string | null
}

export interface EngineVersionSnapshot {
  base_version_id: string
  condition_overlay_version_ids: readonly string[]
  override_version_id: string | null
}

export interface FiredRuleSummary {
  rule_id: string
  severity: Severity
  notify_doctor: boolean
  message: string
}

/**
 * Full envelope returned by adaptiveEngine.generate.
 * Phase-d's engineService wraps this with {patient_id, check_in_id, plan_date}
 * and POSTs to /v1/daily-plans/fallback-submit.
 */
export interface EngineResult {
  plan: GeneratedPlan
  reasoning: string
  rules_fired: readonly FiredRuleSummary[]
  engine_version_snapshot: EngineVersionSnapshot
  doctor_flag_raised: boolean
  doctor_flag_reason?: string
}

// ─── Error codes ────────────────────────────────────────────────────────────

export type EngineErrorCode =
  | 'ENGINE_NO_BASE_VERSION'
  | 'ENGINE_NO_MEALS_IN_CATEGORY'
  | 'ENGINE_NO_EXERCISES'
  | 'ENGINE_INVALID_INPUTS'
  | 'ENGINE_MERGE_CONFLICT'
  | 'ENGINE_SAFETY_INVARIANT_VIOLATED'
