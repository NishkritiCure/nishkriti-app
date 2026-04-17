/**
 * Targeted tests for safety-net code paths that the normal engine pipeline
 * cannot exercise by construction. Lets us hit 100% branch coverage without
 * contorting the happy-path tests.
 */

import { describe, expect, it } from 'vitest'

import { enforceSafetyInvariants, generate } from '@/engine/adaptiveEngine'
import { mergeEngineLayers } from '@/engine/engineConfig'
import { determineDuration, determineIntensity, selectExercises } from '@/engine/exerciseSelector'
import { calculateMacros } from '@/engine/macroCalculator'
import { patientSeededIndex, selectMealForSlot } from '@/engine/mealSelector'
import { evaluateRules, getMetricValue, isDataSourceAvailable } from '@/engine/ruleEvaluator'
import { buildBaselineInputs } from './helpers/makeInputs'
import { makeExercise } from './helpers/makeLibrary'
import { EngineError } from '@/services/errorService'
import type {
  EngineActiveLayers,
  EngineBaseVersion,
  FiredRule,
  GeneratedPlan,
  MergedRules,
  ProtocolRule,
  WorkoutPlan,
} from '@/engine/types'

import { makeCheckIn, makeCtx, makeCycle } from './helpers/makeCheckIn'
import { makeActiveLayers, makeBaseContent, makeRule } from './helpers/makeLayers'
import { makeMeal } from './helpers/makeLibrary'
import { makePatient } from './helpers/makePatient'

function baseMerged(): MergedRules {
  return {
    content: makeBaseContent(),
    version_snapshot: {
      base_version_id: makeActiveLayers().base_version_id,
      condition_overlay_version_ids: [],
      override_version_id: null,
    },
  }
}

function plan(overrides: Partial<GeneratedPlan> = {}): GeneratedPlan {
  const workout: WorkoutPlan = {
    type: 'Home Resistance',
    duration_min: 45,
    intensity: 'moderate',
    exercises: [],
    post_meal_walks: [],
  }
  return {
    diet_type: 'low_carb',
    calorie_target: 1800,
    carbs_target_g: 180,
    protein_target_g: 158,
    fat_target_g: 50,
    water_target_ml: 2000,
    meals: Array.from({ length: 6 }, () => ({
      slot: 'breakfast',
      item: makeMeal(),
    })),
    workout,
    supplements: [],
    supplement_note: null,
    ...overrides,
  }
}

// ─── adaptiveEngine safety invariants (defense-in-depth) ───────────────────

describe('enforceSafetyInvariants (direct)', () => {
  it('throws when carbs below ABSOLUTE_MIN_G', () => {
    expect(() =>
      enforceSafetyInvariants(
        plan({ carbs_target_g: 10, calorie_target: 10 * 4 + 158 * 4 + 50 * 9 }),
        baseMerged(),
        []
      )
    ).toThrow(EngineError)
  })

  it('throws when DR004 fired but carbs below CRITICAL_FLOOR_G', () => {
    const fired: FiredRule[] = [
      {
        rule_id: 'DR004',
        severity: 'critical',
        notify_doctor: true,
        message: '',
        diet_actions: [],
        workout_actions: [],
      },
    ]
    const p = plan({
      carbs_target_g: 25,
      calorie_target: 25 * 4 + 158 * 4 + 50 * 9,
      workout: {
        type: 'Rest',
        duration_min: 10,
        intensity: 'rest',
        exercises: [],
        post_meal_walks: [],
      },
    })
    expect(() => enforceSafetyInvariants(p, baseMerged(), fired)).toThrow(EngineError)
  })

  it('throws when calorie_target drifts from derived macros by more than 5', () => {
    const p = plan({ calorie_target: 99999 })
    expect(() => enforceSafetyInvariants(p, baseMerged(), [])).toThrow(EngineError)
  })

  it('throws when a critical-FBS rule fired but workout is not rest', () => {
    const fired: FiredRule[] = [
      {
        rule_id: 'DR005',
        severity: 'critical',
        notify_doctor: true,
        message: '',
        diet_actions: [],
        workout_actions: [],
      },
    ]
    expect(() => enforceSafetyInvariants(plan(), baseMerged(), fired)).toThrow(EngineError)
  })

  it('throws when meals.length does not equal configured slot count', () => {
    const p = plan({ meals: [] })
    expect(() => enforceSafetyInvariants(p, baseMerged(), [])).toThrow(EngineError)
  })
})

// ─── mealSelector fallback chain (levels 2, 3) ─────────────────────────────

describe('mealSelector fallback chain', () => {
  it('level 2 — drops diet-type filter when preferred path empties', () => {
    // Only meal in library does NOT match diet type but DOES match slot.
    const library = [
      makeMeal({
        id: 'm-off-diet',
        slots: ['breakfast'],
        diet_types: ['high_carb'], // not low_carb
        is_veg: true,
      }),
    ]
    const pick = selectMealForSlot(
      'breakfast',
      library,
      'low_carb',
      makePatient({ diet_preference: 'veg', cuisine_preference: [] }),
      makeCheckIn(),
      []
    )
    expect(pick.item.id).toBe('m-off-diet')
  })

  it('non_veg patient in level-1 fallback accepts any in-slot meal', () => {
    const library = [
      makeMeal({
        id: 'm-off',
        slots: ['breakfast'],
        diet_types: ['high_carb'],
        is_veg: false,
      }),
    ]
    const pick = selectMealForSlot(
      'breakfast',
      library,
      'low_carb',
      makePatient({ diet_preference: 'non_veg', cuisine_preference: [] }),
      makeCheckIn(),
      []
    )
    expect(pick.item.id).toBe('m-off')
  })

  it('patientSeededIndex returns 0 when length is 0', () => {
    expect(patientSeededIndex('p', '2026-04-17', 'breakfast', 0)).toBe(0)
  })

  it('level 2 — library safety net when even veg filter empties', () => {
    const library = [
      makeMeal({
        id: 'm-non-veg',
        slots: ['breakfast'],
        diet_types: ['low_carb'],
        is_veg: false,
      }),
    ]
    const pick = selectMealForSlot(
      'breakfast',
      library,
      'low_carb',
      makePatient({ diet_preference: 'veg', cuisine_preference: [] }),
      makeCheckIn(),
      []
    )
    expect(pick.item.id).toBe('m-non-veg')
  })
})

// ─── ruleEvaluator edge paths ──────────────────────────────────────────────

describe('ruleEvaluator getMetricValue edge paths', () => {
  it('cycle metric returns null when cycles array has a falsy first element', () => {
    const rule = makeRule({ metric: 'cycle' })
    const ctx = makeCtx({
      recent_cycles: [null as unknown as ReturnType<typeof makeCycle>],
    })
    // isDataSourceAvailable says cycles present (length > 0). getMetricValue
    // then hits the guard for a missing `last` row and returns null.
    expect(isDataSourceAvailable(rule, ctx)).toBe(true)
    expect(getMetricValue(rule, ctx)).toBeNull()
  })

  it('lipid_panel returns null when labs have no triglycerides', () => {
    const rule = makeRule({ metric: 'lipid_panel', data_source: 'lab_integration' })
    const ctx = makeCtx({
      recent_labs: [
        {
          id: 'lab-1',
          patient_id: 'p-1',
          collected_on: '2026-04-17',
          tsh: null,
          hba1c: null,
          ldl: 130,
          hdl: 50,
          triglycerides: null,
        },
      ],
    })
    expect(getMetricValue(rule, ctx)).toBeNull()
  })

  it('adherence metric returns null when all entries are null', () => {
    const rule = makeRule({ metric: 'adherence', window_days: 3 })
    const ctx = makeCtx({
      check_in: makeCheckIn({ adherence_yesterday: null }),
      recent_check_ins: [
        makeCheckIn({ adherence_yesterday: null }),
        makeCheckIn({ adherence_yesterday: null }),
      ],
    })
    expect(getMetricValue(rule, ctx)).toBeNull()
  })
})

// ─── engineConfig corner cases ─────────────────────────────────────────────

describe('mergeEngineLayers corner cases', () => {
  it('throws when base.content_json is missing', () => {
    const broken = {
      id: 'b',
      version: 1,
      content_json: null,
    } as unknown as EngineBaseVersion
    const layers = makeActiveLayers()
    expect(() => mergeEngineLayers(broken, [], null, layers, 'diabetes_t2')).toThrow(EngineError)
  })
})

// ─── ruleEvaluator fbs window with null ─────────────────────────────────────

describe('fbs window with mixed null rows still enforces window_days guard', () => {
  it('single-day rule reads today directly even without history', () => {
    const rule: ProtocolRule = makeRule({
      operator: 'gt',
      threshold: 150,
      window_days: 1,
    })
    const ctx = makeCtx({ check_in: makeCheckIn({ fbs_mg_dl: 200 }) })
    expect(getMetricValue(rule, ctx)).toBe(200)
  })

  it('single-day rule returns null when fbs_mg_dl is null', () => {
    const rule = makeRule({ operator: 'gt', threshold: 150, window_days: 1 })
    const ctx = makeCtx({ check_in: makeCheckIn({ fbs_mg_dl: null }) })
    expect(getMetricValue(rule, ctx)).toBeNull()
  })
})

// ─── adaptiveEngine input validation edges ─────────────────────────────────

describe('adaptiveEngine.generate input validation (explicit paths)', () => {
  it('throws ENGINE_INVALID_INPUTS when check_in_date is empty', () => {
    const inputs = buildBaselineInputs({ check_in: { check_in_date: '' } })
    expect(() => generate(inputs)).toThrow(EngineError)
  })
})

describe('exerciseSelector default ?? branches', () => {
  it('determineIntensity with null fbs AND null energy resolves defaults', () => {
    // null fbs → 0 (no fbs>180). null energy → 5 (≥4) → "high".
    expect(determineIntensity(makeCheckIn({ fbs_mg_dl: null, energy_level: null }))).toBe('high')
  })

  it('determineDuration with null fbs AND null energy + no workoutMinutes → 45', () => {
    expect(
      determineDuration(makeCheckIn({ fbs_mg_dl: null, energy_level: null, requests: null }))
    ).toBe(45)
  })

  it('determineDifficultyCap with null fbs + null energy caps at 2 (energy??0 ≤ 2)', () => {
    // null energy defaults to 0 → energy≤2 → cap 2. Difficulty-2 exercise survives.
    const lib = [makeExercise({ difficulty: 2, equipment_required: [], locations: ['home'] })]
    const picks = selectExercises(
      makePatient({ workout_location: ['home'], workout_equipment: [] }),
      makeCheckIn({ fbs_mg_dl: null, energy_level: null }),
      lib
    )
    expect(picks).toHaveLength(1)
  })
})

describe('adaptiveEngine supplement_note pipeline', () => {
  it('joins note diet_actions from fired rules into supplement_note', () => {
    const inputs = buildBaselineInputs({
      check_in: { fbs_mg_dl: 200, energy_level: 3 }, // fire DR003 from baseline rules
      rules: [
        {
          id: 'NOTE-RULE',
          condition: 'global',
          metric: 'fbs',
          operator: 'gt',
          threshold: 150,
          window_days: 1,
          severity: 'medium',
          notify_doctor: false,
          diet_actions: [
            { type: 'note', text: 'Increase hydration today.' },
            { type: 'note' }, // no text → short-circuit skip
          ],
          workout_actions: [],
          reasoning_template: 'FBS {fbs}.',
          data_source: 'check_in',
        },
      ],
    })
    const result = generate(inputs)
    expect(result.plan.supplement_note).toBe('Increase hydration today.')
  })
})

describe('macroCalculator sumCarbDeltas branches', () => {
  it('skips carb_delta action whose value_g is not a number', () => {
    const patient = makePatient()
    const protocol = {
      id: 'pr-1',
      patient_id: 'p-1',
      condition: 'diabetes_t2' as const,
      diet_type: 'low_carb' as const,
      calorie_target: 1800,
      carbs_target_g: null,
      protein_target_g: null,
      fat_target_g: null,
      water_target_ml: null,
    }
    const fired: FiredRule[] = [
      {
        rule_id: 'X',
        severity: 'low',
        notify_doctor: false,
        message: '',
        diet_actions: [{ type: 'carb_delta' }],
        workout_actions: [],
      },
    ]
    const { macros } = calculateMacros(
      patient,
      protocol,
      fired,
      baseMerged(),
      new Date('2026-01-01T00:00:00Z')
    )
    expect(macros.carbs_target_g).toBe(180)
  })

  it('ignores non-carb_delta actions entirely', () => {
    const patient = makePatient()
    const protocol = {
      id: 'pr-1',
      patient_id: 'p-1',
      condition: 'diabetes_t2' as const,
      diet_type: 'low_carb' as const,
      calorie_target: 1800,
      carbs_target_g: null,
      protein_target_g: null,
      fat_target_g: null,
      water_target_ml: null,
    }
    const fired: FiredRule[] = [
      {
        rule_id: 'X',
        severity: 'low',
        notify_doctor: false,
        message: '',
        diet_actions: [{ type: 'note', text: 'some note' }],
        workout_actions: [],
      },
    ]
    const { macros } = calculateMacros(
      patient,
      protocol,
      fired,
      baseMerged(),
      new Date('2026-01-01T00:00:00Z')
    )
    expect(macros.carbs_target_g).toBe(180)
  })
})

// ─── Cycle rule with invalid dates (defensive) ─────────────────────────────

describe('Cycle rule robustness', () => {
  it('returns a numeric delta for a valid cycle_start_date', () => {
    const rule = makeRule({ metric: 'cycle', data_source: 'cycle_tracking' })
    const ctx = makeCtx({ recent_cycles: [makeCycle({ cycle_start_date: '2026-04-01' })] })
    const v = getMetricValue(rule, ctx)
    expect(typeof v).toBe('number')
    expect(v as number).toBeGreaterThan(0)
  })
})

// ─── Active-layers missing base_version_id (defensive) ─────────────────────

describe('mergeEngineLayers preserves version_snapshot with undefined override', () => {
  it('override_version_id null flows through snapshot', () => {
    const merged = mergeEngineLayers(
      { id: 'b1', version: 1, content_json: makeBaseContent() },
      [],
      null,
      makeActiveLayers({ override_version_id: null }) satisfies EngineActiveLayers,
      'diabetes_t2'
    )
    expect(merged.version_snapshot.override_version_id).toBeNull()
  })

  it('applies every optional overlay field when patch provides it', () => {
    const base = makeBaseContent()
    const patch = {
      meal_slots: base.meal_slots,
      macro_defaults: { foo: 1 },
      biomarker_defaults: { fbs: { ...base.biomarker_defaults.fbs, critical: 260 } },
      rules: [makeRule({ id: 'R-NEW' })],
      carb_adjustments: { ...base.carb_adjustments, INCREASE_HYPO_G: 25 },
      macro_splits: { ...base.macro_splits, low_carb: { carbs: 0.45, protein: 0.3, fat: 0.25 } },
      water: { ...base.water, base_ml: 2100 },
      post_meal_walks: {
        fbs_elevated_threshold: 125,
        fbs_high_threshold: 175,
        durations_min: { after_lunch: 18, after_dinner: 22 },
      },
    }
    const merged = mergeEngineLayers(
      { id: 'b1', version: 1, content_json: base },
      [{ id: 'o1', condition: 'diabetes_t2', version: 1, content_json: patch }],
      null,
      makeActiveLayers({ condition_overlay_version_ids: ['o1'] }),
      'diabetes_t2'
    )
    expect(merged.content.water.base_ml).toBe(2100)
    expect(merged.content.macro_splits.low_carb.carbs).toBe(0.45)
    expect(merged.content.carb_adjustments.INCREASE_HYPO_G).toBe(25)
    expect(merged.content.biomarker_defaults.fbs.critical).toBe(260)
    expect(merged.content.post_meal_walks.durations_min.after_lunch).toBe(18)
  })

  it('sort comparator returns 0 when neither overlay is the primary condition', () => {
    // Two overlays, primary is a third condition — sort hits the `return 0` path.
    const base = { id: 'b1', version: 1, content_json: makeBaseContent() }
    const overlayA = {
      id: 'ov-a',
      condition: 'pcos' as const,
      version: 1,
      content_json: { rules: [makeRule({ id: 'PC-X' })] },
    }
    const overlayB = {
      id: 'ov-b',
      condition: 'hypothyroid' as const,
      version: 1,
      content_json: { rules: [makeRule({ id: 'HT-X' })] },
    }
    const merged = mergeEngineLayers(
      base,
      [overlayA, overlayB],
      null,
      makeActiveLayers({ condition_overlay_version_ids: ['ov-a', 'ov-b'] }),
      'diabetes_t2'
    )
    const ids = merged.content.rules.map((r) => r.id)
    expect(ids).toContain('PC-X')
    expect(ids).toContain('HT-X')
  })
})

// ─── ruleEvaluator remaining branches ──────────────────────────────────────

describe('ruleEvaluator ??-fallback and guard paths', () => {
  it('hba1c returns null when labs array has a row with hba1c:null', () => {
    const rule = makeRule({
      metric: 'hba1c',
      operator: 'lt',
      threshold: 5.7,
      data_source: 'lab_integration',
      window_days: 1,
    })
    const ctx = makeCtx({
      recent_labs: [
        {
          id: 'l-1',
          patient_id: 'p-1',
          collected_on: '2026-04-17',
          tsh: null,
          hba1c: null,
          ldl: null,
          hdl: null,
          triglycerides: null,
        },
      ],
    })
    expect(getMetricValue(rule, ctx)).toBeNull()
  })

  it('tsh returns null when labs array has a row with tsh:null', () => {
    const rule = makeRule({
      metric: 'tsh',
      operator: 'gt',
      threshold: 4.5,
      data_source: 'lab_integration',
      window_days: 1,
    })
    const ctx = makeCtx({
      recent_labs: [
        {
          id: 'l-1',
          patient_id: 'p-1',
          collected_on: '2026-04-17',
          tsh: null,
          hba1c: null,
          ldl: null,
          hdl: null,
          triglycerides: null,
        },
      ],
    })
    expect(getMetricValue(rule, ctx)).toBeNull()
  })

  it('sleepMin returns null when values are fewer than window_days', () => {
    const rule = makeRule({
      metric: 'sleep',
      operator: 'lt',
      threshold: 6,
      window_days: 3,
      data_source: 'check_in',
    })
    const ctx = makeCtx({
      check_in: makeCheckIn({ sleep_hours: 5 }),
      recent_check_ins: [], // only today, need 3
    })
    expect(getMetricValue(rule, ctx)).toBeNull()
  })

  it('energyMin returns null when values are fewer than window_days', () => {
    const rule = makeRule({
      metric: 'energy',
      operator: 'lte',
      threshold: 2,
      window_days: 3,
      data_source: 'check_in',
    })
    const ctx = makeCtx({
      check_in: makeCheckIn({ energy_level: 1 }),
      recent_check_ins: [],
    })
    expect(getMetricValue(rule, ctx)).toBeNull()
  })

  it('cycleDaysSince guard: cycles.length === 0 returns null when called directly', () => {
    const rule = makeRule({ metric: 'cycle', data_source: 'cycle_tracking' })
    const ctx = makeCtx({ recent_cycles: [] })
    expect(getMetricValue(rule, ctx)).toBeNull()
  })

  it('template includes null-energy placeholder when an fbs rule fires on a null-energy day', () => {
    const rule = makeRule({
      id: 'FBS-NULL-E',
      metric: 'fbs',
      operator: 'gt',
      threshold: 150,
      window_days: 1,
      reasoning_template: 'FBS {fbs}, energy {energy}.',
    })
    const merged: MergedRules = {
      content: { ...makeBaseContent(), rules: [rule] },
      version_snapshot: {
        base_version_id: 'b1',
        condition_overlay_version_ids: [],
        override_version_id: null,
      },
    }
    const ctx = makeCtx({
      check_in: makeCheckIn({ fbs_mg_dl: 200, energy_level: null }),
    })
    const fired = evaluateRules(ctx, merged)
    expect(fired[0]?.message).toBe('FBS 200, energy —.')
  })

  it('template interpolation includes null-fbs row when a non-fbs rule fires on a null-fbs day', () => {
    const rule = makeRule({
      id: 'E-NULL-FBS',
      metric: 'energy',
      operator: 'lte',
      threshold: 2,
      window_days: 1,
      reasoning_template: 'Energy {energy}, fbs {fbs}.',
    })
    // Use evaluateRules so the `??` right-hand side in template vars runs.
    const merged: MergedRules = {
      content: { ...makeBaseContent(), rules: [rule] },
      version_snapshot: {
        base_version_id: 'b1',
        condition_overlay_version_ids: [],
        override_version_id: null,
      },
    }
    const ctx = makeCtx({
      patient: makePatient({ conditions: ['diabetes_t2'], primary_condition: 'diabetes_t2' }),
      check_in: makeCheckIn({ fbs_mg_dl: null, energy_level: 1 }),
    })
    const fired = evaluateRules(ctx, merged)
    expect(fired[0]?.message).toContain('Energy 1')
    expect(fired[0]?.message).toContain('fbs —')
  })
})
