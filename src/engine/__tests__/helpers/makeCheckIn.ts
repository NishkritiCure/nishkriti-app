import type {
  DailyCheckIn,
  LabResult,
  MenstrualCycle,
  RuleEvaluationContext,
  Vital,
} from '@/engine/types'

import { makePatient } from './makePatient'

export const FIXED_NOW = new Date('2026-04-17T00:00:00Z')
export const TODAY_ISO = '2026-04-17'

export function makeCheckIn(overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    id: 'ci-1',
    patient_id: 'p-1',
    check_in_date: TODAY_ISO,
    fbs_mg_dl: null,
    weight_kg: null,
    waist_cm: null,
    hip_cm: null,
    energy_level: 3,
    sleep_hours: 7,
    symptoms: [],
    adherence_yesterday: 'high',
    requests: null,
    message_for_doctor: null,
    ...overrides,
  }
}

/** Builds N prior check-ins walking backwards from today. */
export function makeHistory(
  count: number,
  build: (dayBack: number) => Partial<DailyCheckIn>
): DailyCheckIn[] {
  return Array.from({ length: count }, (_, i) => {
    const dayBack = i + 1
    const ms = Date.parse(TODAY_ISO + 'T00:00:00Z') - dayBack * 86_400_000
    return makeCheckIn({
      id: `ci-prev-${dayBack}`,
      check_in_date: new Date(ms).toISOString().slice(0, 10),
      ...build(dayBack),
    })
  })
}

export function makeLab(overrides: Partial<LabResult> = {}): LabResult {
  return {
    id: 'lab-1',
    patient_id: 'p-1',
    collected_on: TODAY_ISO,
    tsh: null,
    hba1c: null,
    ldl: null,
    hdl: null,
    triglycerides: null,
    ...overrides,
  }
}

export function makeVital(overrides: Partial<Vital> = {}): Vital {
  return {
    id: 'v-1',
    patient_id: 'p-1',
    recorded_at: TODAY_ISO + 'T06:00:00Z',
    metric_type: 'blood_pressure',
    value_primary: 120,
    value_secondary: 80,
    ...overrides,
  }
}

export function makeCycle(overrides: Partial<MenstrualCycle> = {}): MenstrualCycle {
  return {
    id: 'c-1',
    patient_id: 'p-1',
    cycle_start_date: TODAY_ISO,
    cycle_length_days: 28,
    flow_level: 'medium',
    ...overrides,
  }
}

export function makeCtx(overrides: Partial<RuleEvaluationContext> = {}): RuleEvaluationContext {
  return {
    patient: makePatient(),
    check_in: makeCheckIn(),
    recent_check_ins: [],
    recent_labs: [],
    recent_vitals: [],
    recent_cycles: [],
    now: FIXED_NOW,
    ...overrides,
  }
}
