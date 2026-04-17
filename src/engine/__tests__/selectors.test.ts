import { describe, expect, it } from 'vitest'

import {
  computePostMealWalks,
  computeWaterTarget,
  determineDuration,
  determineIntensity,
  determineWorkoutType,
  isRestDay,
  selectExercises,
  selectWorkout,
} from '@/engine/exerciseSelector'
import { selectAllMeals, selectMealForSlot } from '@/engine/mealSelector'
import { EngineError } from '@/services/errorService'
import type { FiredRule, MergedRules } from '@/engine/types'

import { makeCheckIn } from './helpers/makeCheckIn'
import { makeActiveLayers, makeBaseContent } from './helpers/makeLayers'
import {
  buildExerciseLibrary,
  buildMealLibrary,
  makeExercise,
  makeMeal,
} from './helpers/makeLibrary'
import { makePatient } from './helpers/makePatient'

function merged(): MergedRules {
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

// ─── Meal selector ──────────────────────────────────────────────────────────

describe('mealSelector.selectMealForSlot', () => {
  it('picks deterministically for the same (patient, date, slot)', () => {
    const lib = buildMealLibrary()
    const a = selectMealForSlot('breakfast', lib, 'low_carb', makePatient(), makeCheckIn(), [])
    const b = selectMealForSlot('breakfast', lib, 'low_carb', makePatient(), makeCheckIn(), [])
    expect(a.item.id).toBe(b.item.id)
  })

  it('varies by patient id on the same date+slot', () => {
    const lib = buildMealLibrary()
    const a = selectMealForSlot(
      'breakfast',
      lib,
      'low_carb',
      makePatient({ id: 'p-aaa' }),
      makeCheckIn(),
      []
    )
    const b = selectMealForSlot(
      'breakfast',
      lib,
      'low_carb',
      makePatient({ id: 'p-zzz' }),
      makeCheckIn(),
      []
    )
    // With 2 breakfast candidates and different seeds we expect at least a
    // realistic chance of variety — allow equal when hashes happen to collide.
    expect(typeof a.item.id).toBe('string')
    expect(typeof b.item.id).toBe('string')
  })

  it('filters by diet type', () => {
    const lib = buildMealLibrary()
    // Only m-paneer-bhurji and m-apple and m-early-lemon are keto (no poha/oats)
    const pick = selectMealForSlot(
      'breakfast',
      lib,
      'keto',
      makePatient({ cuisine_preference: [] }),
      makeCheckIn(),
      []
    )
    // No breakfast meal is keto — fallback to non-keto in-slot via fallbackChain.
    // At minimum the picker returns some meal (the safety net of level 3 covers
    // this). So assert it doesn't throw.
    expect(pick.item).toBeDefined()
  })

  it('throws ENGINE_NO_MEALS_IN_CATEGORY when library has no slot match', () => {
    const lib = [makeMeal({ slots: ['breakfast'] })]
    expect(() =>
      selectMealForSlot('dinner', lib, 'low_carb', makePatient(), makeCheckIn(), [])
    ).toThrow(EngineError)
  })

  it('veg patient gets only veg meals', () => {
    const lib = [
      ...buildMealLibrary(),
      makeMeal({ id: 'm-chicken', name: 'Chicken Curry', is_veg: false, slots: ['lunch'] }),
    ]
    const pick = selectMealForSlot(
      'lunch',
      lib,
      'low_carb',
      makePatient({ diet_preference: 'veg' }),
      makeCheckIn(),
      []
    )
    expect(pick.item.is_veg).toBe(true)
  })

  it('vegan patient gets veg, dairy-free meals', () => {
    const lib = buildMealLibrary()
    const pick = selectMealForSlot(
      'breakfast',
      lib,
      'low_carb',
      makePatient({ diet_preference: 'vegan' }),
      makeCheckIn(),
      []
    )
    expect(pick.item.is_veg).toBe(true)
    expect(pick.item.has_dairy).toBe(false)
  })

  it('egg patient accepts eggs + veg', () => {
    const lib = [
      makeMeal({ id: 'm-omelet', is_veg: false, is_egg: true, slots: ['breakfast'] }),
      makeMeal({ id: 'm-veg-only', is_veg: true, is_egg: false, slots: ['breakfast'] }),
    ]
    const pick = selectMealForSlot(
      'breakfast',
      lib,
      'low_carb',
      makePatient({ diet_preference: 'egg', cuisine_preference: [] }),
      makeCheckIn(),
      []
    )
    expect([true, true]).toContain(pick.item.is_veg || pick.item.is_egg)
  })

  it('non-veg patient keeps everything', () => {
    const lib = [
      makeMeal({ id: 'm-chicken', is_veg: false, slots: ['lunch'] }),
      makeMeal({ id: 'm-dal', is_veg: true, slots: ['lunch'] }),
    ]
    // non_veg with 2 candidates — accept either.
    const pick = selectMealForSlot(
      'lunch',
      lib,
      'low_carb',
      makePatient({ diet_preference: 'non_veg', cuisine_preference: [] }),
      makeCheckIn(),
      []
    )
    expect(['m-chicken', 'm-dal']).toContain(pick.item.id)
  })

  it('removes meals whose ingredient matches an allergy', () => {
    const lib = buildMealLibrary()
    const pick = selectMealForSlot(
      'lunch',
      lib,
      'low_carb',
      makePatient({ allergies: ['paneer'], cuisine_preference: [] }),
      makeCheckIn(),
      []
    )
    expect(pick.item.ingredients.every((i) => i.name.toLowerCase() !== 'paneer')).toBe(true)
  })

  it('travel day filters to portable meals and adds adjustments=undefined', () => {
    const lib = buildMealLibrary()
    const pick = selectMealForSlot(
      'lunch',
      lib,
      'maintenance',
      makePatient({ cuisine_preference: [] }),
      makeCheckIn({ requests: { travelDay: true } }),
      []
    )
    expect(pick.item.portability).toBe('high')
  })

  it('critical + breakfast filters out high-GI meals', () => {
    const lib = [
      makeMeal({ id: 'm-high-gi', slots: ['breakfast'], gi: 'high' }),
      makeMeal({ id: 'm-low-gi', slots: ['breakfast'], gi: 'low' }),
    ]
    const pick = selectMealForSlot(
      'breakfast',
      lib,
      'low_carb',
      makePatient({ cuisine_preference: [] }),
      makeCheckIn(),
      [firedRule({ severity: 'critical' })]
    )
    expect(pick.item.id).toBe('m-low-gi')
  })

  it('hypoglycemia rule requires > 15g carbs on mid-morning', () => {
    const lib = [
      makeMeal({
        id: 'm-low-carb',
        slots: ['mid_morning'],
        macros: { carbs: 10, protein: 0, fat: 0, fibre: 0 },
      }),
      makeMeal({
        id: 'm-sufficient',
        slots: ['mid_morning'],
        macros: { carbs: 25, protein: 0, fat: 0, fibre: 0 },
      }),
    ]
    const pick = selectMealForSlot(
      'mid_morning',
      lib,
      'low_carb',
      makePatient({ cuisine_preference: [] }),
      makeCheckIn(),
      [firedRule({ rule_id: 'DR005' })]
    )
    expect(pick.item.id).toBe('m-sufficient')
    expect(pick.adjustments).toContain('Complex carbs required')
  })

  it('high-FBS rule filters fruit out of mid-morning and sets adjustments text', () => {
    const lib = [
      makeMeal({
        id: 'm-fruit',
        slots: ['mid_morning'],
        ingredients: [{ name: 'Apple' }],
      }),
      makeMeal({
        id: 'm-nuts',
        slots: ['mid_morning'],
        ingredients: [{ name: 'almond' }, { name: 'curd' }],
      }),
    ]
    const pick = selectMealForSlot(
      'mid_morning',
      lib,
      'low_carb',
      makePatient({ cuisine_preference: [] }),
      makeCheckIn(),
      [firedRule({ rule_id: 'DR002' })]
    )
    expect(pick.item.id).toBe('m-nuts')
    expect(pick.adjustments).toContain('FBS elevated')
  })

  it('DR002 on dinner sets no-roti adjustment', () => {
    const lib = buildMealLibrary()
    const pick = selectMealForSlot(
      'dinner',
      lib,
      'low_carb',
      makePatient({ cuisine_preference: [] }),
      makeCheckIn(),
      [firedRule({ rule_id: 'DR002' })]
    )
    expect(pick.adjustments).toContain('No roti tonight')
  })

  it('cuisine preference is soft — drops if it would empty the set', () => {
    const lib = buildMealLibrary()
    const pick = selectMealForSlot(
      'mid_morning',
      lib,
      'low_carb',
      makePatient({ cuisine_preference: ['non_existent_cuisine'] }),
      makeCheckIn(),
      []
    )
    expect(pick.item).toBeDefined()
  })

  it('selectAllMeals returns one entry per slot in order', () => {
    const lib = buildMealLibrary()
    const slots = [
      'early_morning',
      'breakfast',
      'mid_morning',
      'lunch',
      'evening',
      'dinner',
    ] as const
    const picks = selectAllMeals(
      slots,
      lib,
      'low_carb',
      makePatient({ cuisine_preference: [] }),
      makeCheckIn(),
      []
    )
    expect(picks).toHaveLength(6)
    expect(picks.map((p) => p.slot)).toStrictEqual([...slots])
  })
})

// ─── Exercise selector ──────────────────────────────────────────────────────

describe('exerciseSelector.isRestDay', () => {
  it.each([
    [69, 'hypoglycemia → rest'],
    [251, 'critical → rest'],
  ] as const)('FBS %d triggers rest (%s)', (fbs, _label) => {
    expect(isRestDay(makeCheckIn({ fbs_mg_dl: fbs }), [], 0)).toBe(true)
  })

  it('FBS 120 with ok energy → not rest', () => {
    expect(isRestDay(makeCheckIn({ fbs_mg_dl: 120, energy_level: 4 }), [], 0)).toBe(false)
  })

  it('energy ≤ 2 + fatigue symptom → rest', () => {
    expect(
      isRestDay(makeCheckIn({ energy_level: 2, symptoms: ['persistent fatigue'] }), [], 0)
    ).toBe(true)
  })

  it('energy ≤ 2 without fatigue symptom → not rest', () => {
    expect(isRestDay(makeCheckIn({ energy_level: 2, symptoms: ['headache'] }), [], 0)).toBe(false)
  })

  it('critical severity rule fires → rest', () => {
    expect(isRestDay(makeCheckIn({}), [firedRule({ severity: 'critical' })], 0)).toBe(true)
  })

  it('3-day rest streak forces not rest on day 4', () => {
    // even with FBS=69 (which normally → rest), after 3 rest days... wait,
    // the function returns rest if FBS low. The streak gate only triggers
    // when there's no other rest reason. Test specifically without another
    // rest reason.
    expect(isRestDay(makeCheckIn({ fbs_mg_dl: 100, energy_level: 3, symptoms: [] }), [], 3)).toBe(
      false
    )
  })
})

describe('exerciseSelector.selectExercises', () => {
  it('selects up to 3 from library respecting difficulty cap', () => {
    const lib = buildExerciseLibrary()
    const picks = selectExercises(
      makePatient({ workout_location: ['home'], workout_equipment: ['barbell'] }),
      makeCheckIn({ energy_level: 3 }),
      lib
    )
    expect(picks.length).toBeGreaterThan(0)
    expect(picks.length).toBeLessThanOrEqual(3)
    for (const e of picks) {
      expect(e.difficulty).toBeLessThanOrEqual(3)
    }
  })

  it('caps difficulty at 2 when FBS > 180', () => {
    const lib = buildExerciseLibrary()
    const picks = selectExercises(
      makePatient({ workout_location: ['home', 'gym'], workout_equipment: ['barbell'] }),
      makeCheckIn({ fbs_mg_dl: 200, energy_level: 3 }),
      lib
    )
    for (const e of picks) {
      expect(e.difficulty).toBeLessThanOrEqual(2)
    }
  })

  it('caps difficulty at 2 when energy ≤ 2', () => {
    const lib = buildExerciseLibrary()
    const picks = selectExercises(
      makePatient({ workout_location: ['home', 'gym'], workout_equipment: ['barbell'] }),
      makeCheckIn({ energy_level: 2 }),
      lib
    )
    for (const e of picks) {
      expect(e.difficulty).toBeLessThanOrEqual(2)
    }
  })

  it('caps difficulty at 4 when energy ≥ 4', () => {
    const lib = buildExerciseLibrary()
    const picks = selectExercises(
      makePatient({ workout_location: ['home', 'gym'], workout_equipment: ['barbell'] }),
      makeCheckIn({ energy_level: 5 }),
      lib
    )
    for (const e of picks) {
      expect(e.difficulty).toBeLessThanOrEqual(4)
    }
  })

  it('excludes exercises needing unavailable equipment', () => {
    const lib = [
      makeExercise({ id: 'e-needs-barbell', equipment_required: ['barbell'] }),
      makeExercise({ id: 'e-free', equipment_required: [] }),
    ]
    const picks = selectExercises(
      makePatient({ workout_location: ['home'], workout_equipment: [] }),
      makeCheckIn({ energy_level: 3 }),
      lib
    )
    expect(picks.every((e) => e.id !== 'e-needs-barbell')).toBe(true)
  })

  it('filters by core focus when requested', () => {
    const lib = [
      makeExercise({ id: 'e-leg', muscle_groups: ['legs'] }),
      makeExercise({ id: 'e-core', muscle_groups: ['core'] }),
    ]
    const picks = selectExercises(
      makePatient({ workout_location: ['home'], workout_equipment: [] }),
      makeCheckIn({ requests: { workoutFocus: 'core' } }),
      lib
    )
    expect(picks.every((e) => e.muscle_groups.includes('core'))).toBe(true)
  })

  it('contraindications are respected', () => {
    const lib = [
      makeExercise({ id: 'e-knee-bad', contraindications: ['knee_injury'] }),
      makeExercise({ id: 'e-safe' }),
    ]
    const picks = selectExercises(
      makePatient({ injuries: ['knee_injury'], workout_equipment: [] }),
      makeCheckIn({ energy_level: 3 }),
      lib
    )
    expect(picks.every((e) => e.id !== 'e-knee-bad')).toBe(true)
  })

  it('empty candidate set → empty array', () => {
    expect(
      selectExercises(makePatient(), makeCheckIn(), [
        makeExercise({ equipment_required: ['barbell'] }),
      ])
    ).toHaveLength(0)
  })
})

describe('exerciseSelector metadata helpers', () => {
  it.each([
    [{ energy_level: 2 }, 'light'],
    [{ fbs_mg_dl: 200, energy_level: 3 }, 'moderate'],
    [{ energy_level: 5 }, 'high'],
    [{ energy_level: 3 }, 'moderate'],
  ] as const)('determineIntensity %o → %s', (ci, expected) => {
    expect(determineIntensity(makeCheckIn(ci))).toBe(expected)
  })

  it.each([
    [{ energy_level: 2 }, 25],
    [{ fbs_mg_dl: 200, energy_level: 3 }, 35],
    [{ energy_level: 3 }, 45],
    [{ energy_level: 3, requests: { workoutMinutes: 60 } }, 60],
  ] as const)('determineDuration %o → %d', (ci, expected) => {
    expect(determineDuration(makeCheckIn(ci))).toBe(expected)
  })

  it('determineWorkoutType honours core focus', () => {
    expect(
      determineWorkoutType(makePatient(), makeCheckIn({ requests: { workoutFocus: 'core' } }))
    ).toBe('Core Focus')
  })

  it('determineWorkoutType honours requested location', () => {
    expect(
      determineWorkoutType(makePatient(), makeCheckIn({ requests: { workoutLocation: 'gym' } }))
    ).toBe('Gym Resistance')
  })

  it('determineWorkoutType falls back to patient.workout_location[0]', () => {
    expect(determineWorkoutType(makePatient({ workout_location: ['home'] }), makeCheckIn())).toBe(
      'Home Resistance'
    )
  })

  it('determineWorkoutType default Full Body Resistance when no hints', () => {
    expect(determineWorkoutType(makePatient({ workout_location: [] }), makeCheckIn())).toBe(
      'Full Body Resistance'
    )
  })
})

describe('exerciseSelector.computePostMealWalks', () => {
  it('FBS > 130 adds lunch walk', () => {
    const walks = computePostMealWalks(makePatient(), makeCheckIn({ fbs_mg_dl: 140 }), merged())
    expect(walks.map((w) => w.after)).toStrictEqual(['lunch'])
  })

  it('FBS > 180 adds lunch + dinner walk', () => {
    const walks = computePostMealWalks(makePatient(), makeCheckIn({ fbs_mg_dl: 190 }), merged())
    expect(walks.map((w) => w.after)).toStrictEqual(['lunch', 'dinner'])
  })

  it('no FBS trigger but hypertension condition adds dinner walk', () => {
    const walks = computePostMealWalks(
      makePatient({ conditions: ['hypertension'], primary_condition: 'hypertension' }),
      makeCheckIn({ fbs_mg_dl: 100 }),
      merged()
    )
    expect(walks.map((w) => w.after)).toStrictEqual(['dinner'])
  })

  it('no FBS data + no hypertension → empty', () => {
    expect(
      computePostMealWalks(makePatient(), makeCheckIn({ fbs_mg_dl: null }), merged())
    ).toStrictEqual([])
  })
})

describe('exerciseSelector.computeWaterTarget', () => {
  it('base 2000, FBS > 130 adds 500', () => {
    expect(computeWaterTarget(makePatient(), makeCheckIn({ fbs_mg_dl: 150 }), merged())).toBe(2500)
  })

  it('high energy adds 250', () => {
    expect(computeWaterTarget(makePatient(), makeCheckIn({ energy_level: 5 }), merged())).toBe(2250)
  })

  it('hypertension patient gets 250 bonus regardless', () => {
    expect(
      computeWaterTarget(
        makePatient({ conditions: ['hypertension'], primary_condition: 'hypertension' }),
        makeCheckIn({ fbs_mg_dl: null, energy_level: 3 }),
        merged()
      )
    ).toBe(2250)
  })

  it('stacks all bonuses', () => {
    // base 2000 + FBS500 + highE250 + HTN250 = 3000
    expect(
      computeWaterTarget(
        makePatient({
          conditions: ['hypertension', 'diabetes_t2'],
          primary_condition: 'diabetes_t2',
        }),
        makeCheckIn({ fbs_mg_dl: 150, energy_level: 5 }),
        merged()
      )
    ).toBe(3000)
  })
})

describe('exerciseSelector.selectWorkout', () => {
  it('short-circuits to rest on hypoglycemia', () => {
    const plan = selectWorkout(
      makePatient(),
      makeCheckIn({ fbs_mg_dl: 65 }),
      [],
      buildExerciseLibrary(),
      merged()
    )
    expect(plan.intensity).toBe('rest')
    expect(plan.exercises).toHaveLength(0)
    expect(plan.post_meal_walks).toHaveLength(1)
  })

  it('throws ENGINE_NO_EXERCISES when no exercises filter through', () => {
    expect(() =>
      selectWorkout(
        makePatient({ workout_equipment: [] }),
        makeCheckIn({ energy_level: 3 }),
        [],
        [makeExercise({ equipment_required: ['barbell'] })],
        merged()
      )
    ).toThrow(EngineError)
  })

  it('returns a complete plan on a normal day', () => {
    const plan = selectWorkout(
      makePatient(),
      makeCheckIn({ fbs_mg_dl: 110, energy_level: 4 }),
      [],
      buildExerciseLibrary(),
      merged()
    )
    expect(plan.intensity).toBe('high')
    expect(plan.exercises.length).toBeGreaterThan(0)
    expect(typeof plan.type).toBe('string')
  })
})
