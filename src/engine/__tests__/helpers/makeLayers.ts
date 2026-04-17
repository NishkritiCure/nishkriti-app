import type {
  ConditionType,
  EngineActiveLayers,
  EngineBaseVersion,
  EngineConditionOverlay,
  EngineLayerContent,
  PatientEngineOverride,
  ProtocolRule,
} from '@/engine/types'

export const BASE_VERSION_ID = '00000000-0000-0000-0000-000000000001'
export const DIABETES_OVERLAY_ID = '00000000-0000-0000-0000-0000000000d2'
export const PCOS_OVERLAY_ID = '00000000-0000-0000-0000-0000000000bc'
export const OVERRIDE_ID = '00000000-0000-0000-0000-0000000000ff'

export function makeRule(overrides: Partial<ProtocolRule> = {}): ProtocolRule {
  return {
    id: 'DR001',
    condition: 'diabetes_t2',
    metric: 'fbs',
    operator: 'between',
    threshold: [101, 130] as const,
    window_days: 3,
    severity: 'low',
    notify_doctor: false,
    diet_actions: [],
    workout_actions: [],
    reasoning_template: 'FBS {value} above target.',
    data_source: 'check_in',
    ...overrides,
  }
}

export function makeBaseContent(overrides: Partial<EngineLayerContent> = {}): EngineLayerContent {
  return {
    meal_slots: ['early_morning', 'breakfast', 'mid_morning', 'lunch', 'evening', 'dinner'],
    macro_defaults: {},
    biomarker_defaults: {
      fbs: {
        hypo: 70,
        target: [70, 100] as const,
        amber: [101, 130] as const,
        elevated: [131, 180] as const,
        high: [181, 250] as const,
        critical: 250,
      },
    },
    rules: [makeRule()],
    carb_adjustments: {
      REDUCTION_HIGH_FBS_G: 20,
      CRITICAL_FLOOR_G: 30,
      INCREASE_HYPO_G: 20,
      INCREASE_FATIGUE_G: 15,
      ABSOLUTE_MIN_G: 20,
    },
    macro_splits: {
      low_carb: { carbs: 0.4, protein: 0.35, fat: 0.25 },
      keto: { carbs: 0.1, protein: 0.3, fat: 0.6 },
      high_protein: { carbs: 0.4, protein: 0.4, fat: 0.2 },
      maintenance: { carbs: 0.5, protein: 0.25, fat: 0.25 },
      anti_inflammatory: { carbs: 0.45, protein: 0.3, fat: 0.25 },
      calorie_deficit: { carbs: 0.4, protein: 0.35, fat: 0.25 },
      carb_cycling: { carbs: 0.4, protein: 0.3, fat: 0.3 },
      high_carb: { carbs: 0.6, protein: 0.2, fat: 0.2 },
      high_probiotic: { carbs: 0.45, protein: 0.25, fat: 0.3 },
      frozen_carb: { carbs: 0.4, protein: 0.35, fat: 0.25 },
    },
    water: {
      base_ml: 2000,
      fbs_elevated_bonus_ml: 500,
      high_energy_bonus_ml: 250,
      hypertension_bonus_ml: 250,
    },
    post_meal_walks: {
      fbs_elevated_threshold: 130,
      fbs_high_threshold: 180,
      durations_min: { after_lunch: 15, after_dinner: 20 },
    },
    ...overrides,
  }
}

export function makeBase(content?: Partial<EngineLayerContent>): EngineBaseVersion {
  return {
    id: BASE_VERSION_ID,
    version: 1,
    content_json: makeBaseContent(content),
  }
}

export function makeOverlay(
  condition: ConditionType,
  content_json: EngineConditionOverlay['content_json'],
  id?: string
): EngineConditionOverlay {
  return {
    id: id ?? `00000000-0000-0000-0000-overlay${condition}`,
    condition,
    version: 1,
    content_json,
  }
}

export function makeOverride(
  content_json: PatientEngineOverride['content_json'],
  patient_id = 'p-1'
): PatientEngineOverride {
  return {
    id: OVERRIDE_ID,
    patient_id,
    version: 1,
    content_json,
  }
}

export function makeActiveLayers(overrides: Partial<EngineActiveLayers> = {}): EngineActiveLayers {
  return {
    patient_id: 'p-1',
    base_version_id: BASE_VERSION_ID,
    condition_overlay_version_ids: [DIABETES_OVERLAY_ID],
    override_version_id: null,
    ...overrides,
  }
}
