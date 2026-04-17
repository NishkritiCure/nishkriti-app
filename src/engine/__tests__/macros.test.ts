import { describe, expect, it } from 'vitest'

import {
  calculateAge,
  calculateBMR,
  calculateMacros,
  calculateTDEE,
  determineEffectiveDietType,
  splitMacros,
} from '@/engine/macroCalculator'
import { EngineError } from '@/services/errorService'
import type { FiredRule, MergedRules } from '@/engine/types'

import { makeActiveLayers, makeBaseContent } from './helpers/makeLayers'
import { makePatient, makeProtocol } from './helpers/makePatient'

const FIXED_NOW = new Date('2026-01-01T00:00:00Z')

function makeMerged(): MergedRules {
  return {
    content: makeBaseContent(),
    version_snapshot: {
      base_version_id: makeActiveLayers().base_version_id,
      condition_overlay_version_ids: [],
      override_version_id: null,
    },
  }
}

function firedRule(overrides: Partial<FiredRule> = {}): FiredRule {
  return {
    rule_id: 'DR001',
    severity: 'low',
    notify_doctor: false,
    message: '',
    diet_actions: [],
    workout_actions: [],
    ...overrides,
  }
}

describe('calculateAge', () => {
  it('returns full years as of now, birthday not yet reached', () => {
    // Born 1990-06-15, now 2026-01-01 → 35
    expect(calculateAge('1990-06-15', FIXED_NOW)).toBe(35)
  })

  it('returns full years as of now, birthday passed', () => {
    expect(calculateAge('1990-01-01', FIXED_NOW)).toBe(36)
  })

  it('throws on invalid dob', () => {
    expect(() => calculateAge('not-a-date', FIXED_NOW)).toThrow(EngineError)
  })
})

describe('calculateBMR (Mifflin-St Jeor)', () => {
  it('matches the male formula: 10*kg + 6.25*cm − 5*age + 5', () => {
    // 80 kg, 180 cm, 30 yr, male → 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(calculateBMR(80, 180, 30, 'male')).toBe(1780)
  })

  it('matches the female formula: 10*kg + 6.25*cm − 5*age − 161', () => {
    // 65 kg, 165 cm, 30 yr, female → 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
    expect(calculateBMR(65, 165, 30, 'female')).toBeCloseTo(1370.25, 2)
  })

  it('treats "other" sex with the female formula', () => {
    expect(calculateBMR(65, 165, 30, 'other')).toBeCloseTo(1370.25, 2)
  })
})

describe('calculateTDEE', () => {
  it.each([
    ['sedentary', 1.2],
    ['light', 1.375],
    ['moderate', 1.55],
    ['active', 1.725],
    ['very_active', 1.9],
  ] as const)('applies %s multiplier %f', (activity, mul) => {
    expect(calculateTDEE(1500, activity)).toBeCloseTo(1500 * mul, 3)
  })
})

describe('splitMacros', () => {
  it('splits 2000 kcal on low_carb (40/35/25) to 200/175/56 g, recomputing calories to 2004', () => {
    // 2000 * 0.4 / 4 = 200, 2000 * 0.35 / 4 = 175, 2000 * 0.25 / 9 = 55.56 → 56
    const merged = makeMerged()
    const m = splitMacros(2000, 'low_carb', merged)
    expect(m.carbs_target_g).toBe(200)
    expect(m.protein_target_g).toBe(175)
    expect(m.fat_target_g).toBe(56)
    // Recomputed: 200*4 + 175*4 + 56*9 = 2004
    expect(m.calorie_target).toBe(2004)
  })

  it('splits 2000 kcal on keto (10/30/60) to 50/150/133 g', () => {
    // 2000 * 0.1 / 4 = 50, 2000 * 0.3 / 4 = 150, 2000 * 0.6 / 9 = 133.33 → 133
    const m = splitMacros(2000, 'keto', makeMerged())
    expect(m.carbs_target_g).toBe(50)
    expect(m.protein_target_g).toBe(150)
    expect(m.fat_target_g).toBe(133)
  })

  it.each([
    ['low_carb', 0.4, 0.35, 0.25],
    ['keto', 0.1, 0.3, 0.6],
    ['high_protein', 0.4, 0.4, 0.2],
    ['maintenance', 0.5, 0.25, 0.25],
    ['anti_inflammatory', 0.45, 0.3, 0.25],
    ['calorie_deficit', 0.4, 0.35, 0.25],
    ['carb_cycling', 0.4, 0.3, 0.3],
    ['high_carb', 0.6, 0.2, 0.2],
    ['high_probiotic', 0.45, 0.25, 0.3],
    ['frozen_carb', 0.4, 0.35, 0.25],
  ] as const)(
    'respects the published ratios for %s (%f / %f / %f)',
    (dietType, carbs, protein, fat) => {
      const m = splitMacros(2000, dietType, makeMerged())
      expect(m.carbs_target_g).toBe(Math.round((2000 * carbs) / 4))
      expect(m.protein_target_g).toBe(Math.round((2000 * protein) / 4))
      expect(m.fat_target_g).toBe(Math.round((2000 * fat) / 9))
    }
  )

  it('throws ENGINE_INVALID_INPUTS when diet_type has no configured split', () => {
    const merged = makeMerged()
    // Simulate a corrupt layer by removing the split at runtime.
    const corrupted: MergedRules = {
      ...merged,
      content: {
        ...merged.content,
        macro_splits: { ...merged.content.macro_splits },
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (corrupted.content.macro_splits as Record<string, unknown>)['keto']
    expect(() => splitMacros(2000, 'keto', corrupted)).toThrow(EngineError)
  })
})

describe('determineEffectiveDietType', () => {
  const protocol = makeProtocol({ diet_type: 'maintenance' })

  it('returns protocol.diet_type when no override rules fired', () => {
    expect(determineEffectiveDietType(protocol, [])).toBe('maintenance')
  })

  it('switches to keto when DR004 fires', () => {
    expect(determineEffectiveDietType(protocol, [firedRule({ rule_id: 'DR004' })])).toBe('keto')
  })

  it('switches to keto when DR003 fires', () => {
    expect(determineEffectiveDietType(protocol, [firedRule({ rule_id: 'DR003' })])).toBe('keto')
  })

  it('switches to keto when PC003 fires', () => {
    expect(determineEffectiveDietType(protocol, [firedRule({ rule_id: 'PC003' })])).toBe('keto')
  })

  it('switches to low_carb when DR002 fires and no keto trigger', () => {
    expect(determineEffectiveDietType(protocol, [firedRule({ rule_id: 'DR002' })])).toBe('low_carb')
  })

  it('switches to low_carb when PC002 fires', () => {
    expect(determineEffectiveDietType(protocol, [firedRule({ rule_id: 'PC002' })])).toBe('low_carb')
  })

  it('keto priority beats low_carb when both trigger', () => {
    expect(
      determineEffectiveDietType(protocol, [
        firedRule({ rule_id: 'DR002' }),
        firedRule({ rule_id: 'DR004' }),
      ])
    ).toBe('keto')
  })

  it('applies explicit diet_type_override action when no ID-based trigger matches', () => {
    expect(
      determineEffectiveDietType(protocol, [
        firedRule({
          rule_id: 'XX999',
          diet_actions: [{ type: 'diet_type_override', diet_type: 'high_protein' }],
        }),
      ])
    ).toBe('high_protein')
  })
})

describe('calculateMacros — integration', () => {
  it('uses protocol.calorie_target when set and applies carb delta from fired rules', () => {
    const patient = makePatient({
      sex: 'female',
      weight_kg: 65,
      height_cm: 165,
      activity_level: 'moderate',
    })
    const protocol = makeProtocol({ calorie_target: 1800, diet_type: 'low_carb' })
    // Baseline low_carb at 1800: 180c / 158p / 50f → calories 180*4 + 158*4 + 50*9 = 1802
    // With -20g carb delta: carbs = 160, calories = 160*4 + 158*4 + 50*9 = 1722
    const fired: FiredRule[] = [
      firedRule({
        rule_id: 'DR002',
        diet_actions: [{ type: 'carb_delta', value_g: -20 }],
      }),
    ]
    const merged = makeMerged()

    const { macros, effective_diet_type } = calculateMacros(
      patient,
      protocol,
      fired,
      merged,
      FIXED_NOW
    )

    expect(effective_diet_type).toBe('low_carb')
    expect(macros.carbs_target_g).toBe(160)
    expect(macros.protein_target_g).toBe(158)
    expect(macros.fat_target_g).toBe(50)
    expect(macros.calorie_target).toBe(160 * 4 + 158 * 4 + 50 * 9)
  })

  it('falls back to TDEE − 350 when protocol calorie_target is null', () => {
    const patient = makePatient({
      sex: 'male',
      weight_kg: 80,
      height_cm: 180,
      activity_level: 'moderate',
      dob: '1990-01-01',
    })
    const protocol = makeProtocol({ calorie_target: null, diet_type: 'maintenance' })
    // Age 36 (2026-01-01 − 1990-01-01) → BMR = 10*80 + 6.25*180 - 5*36 + 5 = 1750 − 180 + 5 + 1125 = wait
    // 10*80 = 800, 6.25*180 = 1125, 5*36 = 180, male +5 → 800 + 1125 - 180 + 5 = 1750
    // TDEE moderate: 1750 * 1.55 = 2712.5 → round(2712.5 - 350) = 2363 (Math.round half-to-even)
    // Node Math.round(2362.5) = 2363
    const merged = makeMerged()

    const { macros } = calculateMacros(patient, protocol, [], merged, FIXED_NOW)

    // maintenance 50/25/25 on 2363 → 295c / 148p / 66f
    expect(macros.carbs_target_g).toBe(Math.round((2363 * 0.5) / 4))
    expect(macros.protein_target_g).toBe(Math.round((2363 * 0.25) / 4))
    expect(macros.fat_target_g).toBe(Math.round((2363 * 0.25) / 9))
  })

  it('enforces ABSOLUTE_MIN_G floor when carb delta would drop carbs below 20', () => {
    const patient = makePatient()
    const protocol = makeProtocol({ calorie_target: 1200, diet_type: 'low_carb' })
    // 1200 low_carb: 120c / 105p / 33f. Delta -200 would give -80 — clamp to 20.
    const fired: FiredRule[] = [
      firedRule({ diet_actions: [{ type: 'carb_delta', value_g: -200 }] }),
    ]

    const { macros } = calculateMacros(patient, protocol, fired, makeMerged(), FIXED_NOW)

    expect(macros.carbs_target_g).toBe(20)
  })

  it('enforces CRITICAL_FLOOR_G (30g) when DR004 fires regardless of baseline', () => {
    const patient = makePatient()
    const protocol = makeProtocol({ calorie_target: 1800, diet_type: 'low_carb' })
    // DR004 triggers keto override → 1800 keto: 45c / 135p / 120f. Without the floor, 45.
    // Floor of 30 is below 45 so it should not bump; but with a big negative delta it should.
    const fired: FiredRule[] = [
      firedRule({
        rule_id: 'DR004',
        diet_actions: [{ type: 'carb_delta', value_g: -30 }],
      }),
    ]

    const { macros, effective_diet_type } = calculateMacros(
      patient,
      protocol,
      fired,
      makeMerged(),
      FIXED_NOW
    )

    expect(effective_diet_type).toBe('keto')
    // 45 - 30 = 15 → below absolute min 20 → clamp to 20 → below critical floor 30 → clamp to 30
    expect(macros.carbs_target_g).toBe(30)
  })

  it('preserves invariant calorie = c*4 + p*4 + f*9 after adjustment', () => {
    const patient = makePatient()
    const protocol = makeProtocol({ calorie_target: 2000, diet_type: 'low_carb' })
    const fired: FiredRule[] = [firedRule({ diet_actions: [{ type: 'carb_delta', value_g: -20 }] })]

    const { macros } = calculateMacros(patient, protocol, fired, makeMerged(), FIXED_NOW)

    expect(macros.calorie_target).toBe(
      macros.carbs_target_g * 4 + macros.protein_target_g * 4 + macros.fat_target_g * 9
    )
  })
})
