import type { DailyCheckIn, EngineInputs, ProtocolRule } from '@/engine/types'

import { FIXED_NOW, makeCheckIn } from './makeCheckIn'
import { makeActiveLayers, makeBase, makeRule } from './makeLayers'
import { buildExerciseLibrary, buildMealLibrary, buildSupplementLibrary } from './makeLibrary'
import { makePatient, makeProtocol } from './makePatient'

/** Baseline rule set used by the golden harness — compact fallback catalog. */
export function baselineRules(): ProtocolRule[] {
  return [
    makeRule({
      id: 'DR001',
      operator: 'between',
      threshold: [101, 130],
      window_days: 3,
      severity: 'low',
      reasoning_template: 'FBS {fbs} elevated for 3 days — watch trend.',
    }),
    makeRule({
      id: 'DR002',
      operator: 'between',
      threshold: [131, 180],
      window_days: 2,
      severity: 'high',
      diet_actions: [{ type: 'carb_delta', value_g: -20 }],
      reasoning_template: 'FBS {fbs} — carbs reduced by 20g, no carbs after 6:30pm.',
    }),
    makeRule({
      id: 'DR003',
      operator: 'between',
      threshold: [181, 250],
      window_days: 1,
      severity: 'high',
      notify_doctor: true,
      diet_actions: [{ type: 'carb_delta', value_g: -20 }],
      reasoning_template: 'FBS {fbs} — strict low-carb, keto today.',
    }),
    makeRule({
      id: 'DR004',
      operator: 'gt',
      threshold: 250,
      window_days: 1,
      severity: 'critical',
      notify_doctor: true,
      diet_actions: [{ type: 'carb_delta', value_g: -30 }],
      reasoning_template: 'FBS {fbs} critical — suspend exercise, walking only.',
    }),
    makeRule({
      id: 'DR005',
      operator: 'lt',
      threshold: 70,
      window_days: 1,
      severity: 'critical',
      notify_doctor: true,
      diet_actions: [{ type: 'carb_delta', value_g: 20 }],
      reasoning_template: 'FBS {fbs} — hypoglycemia, mid-morning complex carbs.',
    }),
    makeRule({
      id: 'DR011',
      metric: 'energy',
      operator: 'lte',
      threshold: 2,
      window_days: 3,
      severity: 'medium',
      diet_actions: [{ type: 'carb_delta', value_g: 15 }],
      reasoning_template: 'Energy {energy} low — fatigue protocol.',
    }),
    makeRule({
      id: 'PC002',
      condition: 'pcos',
      operator: 'between',
      threshold: [131, 180],
      window_days: 2,
      severity: 'high',
      diet_actions: [{ type: 'carb_delta', value_g: -20 }],
      reasoning_template: 'PCOS FBS {fbs} — strict low-carb.',
    }),
    makeRule({
      id: 'HT030',
      condition: 'hypothyroid',
      metric: 'sleep',
      operator: 'lt',
      threshold: 6,
      window_days: 3,
      severity: 'medium',
      reasoning_template: 'Sleep {value}h — magnesium + move workout to morning.',
    }),
  ]
}

export interface MakeInputsOverrides {
  patient?: Partial<Parameters<typeof makePatient>[0]>
  protocol?: Partial<Parameters<typeof makeProtocol>[0]>
  check_in?: Partial<DailyCheckIn>
  recent_check_ins?: DailyCheckIn[]
  rules?: ProtocolRule[]
  now?: Date
}

export function buildBaselineInputs(overrides: MakeInputsOverrides = {}): EngineInputs {
  const patient = makePatient(overrides.patient)
  const protocol = makeProtocol({
    patient_id: patient.id,
    condition: patient.primary_condition,
    ...overrides.protocol,
  })

  return {
    patient,
    protocol,
    check_in: makeCheckIn({ patient_id: patient.id, ...overrides.check_in }),
    recent_check_ins: overrides.recent_check_ins ?? [],
    recent_labs: [],
    recent_vitals: [],
    recent_cycles: [],
    patient_supplements: [],
    active_layers: makeActiveLayers({
      patient_id: patient.id,
      condition_overlay_version_ids: [],
    }),
    base_version: makeBase({ rules: overrides.rules ?? baselineRules() }),
    condition_overlays: [],
    patient_override: null,
    libraries: {
      meals: buildMealLibrary(),
      exercises: buildExerciseLibrary(),
      supplements: buildSupplementLibrary(),
    },
    now: overrides.now ?? FIXED_NOW,
  }
}
