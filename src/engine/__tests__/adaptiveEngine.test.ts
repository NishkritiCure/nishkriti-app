import { describe, expect, it } from 'vitest'

import { generate } from '@/engine/adaptiveEngine'
import { EngineError } from '@/services/errorService'
import type { DailyCheckIn, EngineInputs, PatientSupplement } from '@/engine/types'

import { FIXED_NOW, makeCheckIn } from './helpers/makeCheckIn'
import { makeActiveLayers, makeBase, makeRule } from './helpers/makeLayers'
import {
  buildExerciseLibrary,
  buildMealLibrary,
  buildSupplementLibrary,
} from './helpers/makeLibrary'
import { makePatient, makeProtocol } from './helpers/makePatient'

function makeInputs(overrides: Partial<EngineInputs> = {}): EngineInputs {
  const patient = overrides.patient ?? makePatient()
  const protocol = overrides.protocol ?? makeProtocol({ patient_id: patient.id })
  const check_in: DailyCheckIn =
    overrides.check_in ?? makeCheckIn({ patient_id: patient.id, fbs_mg_dl: 110 })
  return {
    patient,
    protocol,
    check_in,
    recent_check_ins: [],
    recent_labs: [],
    recent_vitals: [],
    recent_cycles: [],
    patient_supplements: [],
    active_layers: makeActiveLayers({
      patient_id: patient.id,
      condition_overlay_version_ids: [],
    }),
    base_version: makeBase({ rules: [makeRule()] }),
    condition_overlays: [],
    patient_override: null,
    libraries: {
      meals: buildMealLibrary(),
      exercises: buildExerciseLibrary(),
      supplements: buildSupplementLibrary(),
    },
    now: FIXED_NOW,
    ...overrides,
  }
}

describe('adaptiveEngine.generate — envelope', () => {
  it('returns the full EngineResult envelope with engine_version_snapshot', () => {
    const result = generate(makeInputs())

    expect(result.plan).toBeDefined()
    expect(result.reasoning).toBeDefined()
    expect(Array.isArray(result.rules_fired)).toBe(true)
    expect(result.engine_version_snapshot.base_version_id).toBeDefined()
    expect(result.engine_version_snapshot.condition_overlay_version_ids).toStrictEqual([])
    expect(result.doctor_flag_raised).toBe(false)
  })

  it('plan has exactly the 10 snake_case fields of the fallback-submit contract', () => {
    const { plan } = generate(makeInputs())
    expect(Object.keys(plan).sort()).toStrictEqual(
      [
        'calorie_target',
        'carbs_target_g',
        'diet_type',
        'fat_target_g',
        'meals',
        'protein_target_g',
        'supplement_note',
        'supplements',
        'water_target_ml',
        'workout',
      ].sort()
    )
  })

  it('meals length equals configured slot count', () => {
    const { plan } = generate(makeInputs())
    expect(plan.meals).toHaveLength(6)
  })

  it('populates supplements from active patient_supplements only', () => {
    const active: PatientSupplement = {
      id: 'ps-1',
      patient_id: 'p-1',
      supplement_library_id: 's-b12',
      name: 'Vitamin B12',
      dose: '1000 mcg',
      timing: 'after breakfast',
      with_food: 'yes',
      is_active: true,
    }
    const inactive: PatientSupplement = { ...active, id: 'ps-2', is_active: false }
    const { plan } = generate(makeInputs({ patient_supplements: [active, inactive] }))

    expect(plan.supplements).toHaveLength(1)
    expect(plan.supplements[0]?.name).toBe('Vitamin B12')
  })

  it('sets doctor_flag_raised when a fired rule has notify_doctor:true', () => {
    const base = makeBase({
      rules: [
        makeRule({
          id: 'DR003',
          operator: 'gt',
          threshold: 180,
          window_days: 1,
          severity: 'high',
          notify_doctor: true,
          reasoning_template: 'FBS {fbs} is very high.',
        }),
      ],
    })
    const result = generate(
      makeInputs({
        base_version: base,
        check_in: makeCheckIn({ fbs_mg_dl: 200 }),
      })
    )
    expect(result.doctor_flag_raised).toBe(true)
    expect(result.doctor_flag_reason).toContain('DR003')
  })

  it('enforces diet-type override cascade when DR003 fires (→ keto)', () => {
    const base = makeBase({
      rules: [
        makeRule({
          id: 'DR003',
          operator: 'between',
          threshold: [181, 250] as const,
          window_days: 1,
          severity: 'high',
          notify_doctor: true,
          diet_actions: [{ type: 'carb_delta', value_g: -20 }],
          reasoning_template: 'FBS {fbs} — strict low-carb, keto today.',
        }),
      ],
    })
    const { plan } = generate(
      makeInputs({
        base_version: base,
        protocol: makeProtocol({ diet_type: 'low_carb' }),
        check_in: makeCheckIn({ fbs_mg_dl: 200 }),
      })
    )
    expect(plan.diet_type).toBe('keto')
  })

  it('forces rest-day workout when DR004 fires (critical FBS)', () => {
    const base = makeBase({
      rules: [
        makeRule({
          id: 'DR004',
          operator: 'gt',
          threshold: 250,
          window_days: 1,
          severity: 'critical',
          notify_doctor: true,
          reasoning_template: 'FBS {fbs} critical.',
          diet_actions: [{ type: 'carb_delta', value_g: -30 }],
        }),
      ],
    })
    const { plan } = generate(
      makeInputs({
        base_version: base,
        check_in: makeCheckIn({ fbs_mg_dl: 260 }),
      })
    )
    expect(plan.workout.intensity).toBe('rest')
    // DKA protection floor still respected.
    expect(plan.carbs_target_g).toBeGreaterThanOrEqual(30)
  })

  it('calorie_target invariant is enforced (|Δ| ≤ 5 kcal of derived sum)', () => {
    const { plan } = generate(makeInputs())
    const derived = plan.carbs_target_g * 4 + plan.protein_target_g * 4 + plan.fat_target_g * 9
    expect(Math.abs(plan.calorie_target - derived)).toBeLessThanOrEqual(5)
  })
})

describe('adaptiveEngine.generate — input validation', () => {
  it('throws ENGINE_INVALID_INPUTS on missing patient id', () => {
    const inputs = makeInputs()
    const broken: EngineInputs = { ...inputs, patient: { ...inputs.patient, id: '' } }
    expect(() => generate(broken)).toThrow(EngineError)
  })

  it('throws when protocol belongs to a different patient', () => {
    const inputs = makeInputs()
    const broken: EngineInputs = {
      ...inputs,
      protocol: { ...inputs.protocol, patient_id: 'someone-else' },
    }
    expect(() => generate(broken)).toThrow(EngineError)
  })

  it('throws ENGINE_NO_BASE_VERSION when base version missing', () => {
    const inputs = makeInputs()
    const broken: EngineInputs = {
      ...inputs,
      base_version: null as unknown as EngineInputs['base_version'],
    }
    expect(() => generate(broken)).toThrow(EngineError)
  })

  it('throws when active_layers point at a different patient', () => {
    const inputs = makeInputs()
    const broken: EngineInputs = {
      ...inputs,
      active_layers: { ...inputs.active_layers, patient_id: 'other' },
    }
    expect(() => generate(broken)).toThrow(EngineError)
  })
})

describe('adaptiveEngine.generate — determinism', () => {
  it('same inputs → byte-identical plan', () => {
    const a = generate(makeInputs())
    const b = generate(makeInputs())
    expect(JSON.stringify(a.plan)).toBe(JSON.stringify(b.plan))
  })
})
