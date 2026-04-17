/**
 * Golden-file integration tests.
 *
 * Each fixture under `fixtures/engine/*.json` describes a scenario:
 *   { name, description, inputs (overrides), expected (shape assertions) }
 * The harness feeds inputs through baseline builders + generate(), and asserts
 * the returned plan's key fields. Fixtures are snapshots — changes go through
 * code review.
 */

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { generate } from '@/engine/adaptiveEngine'
import type { DietType } from '@/engine/types'

import { buildBaselineInputs } from '../helpers/makeInputs'

interface GoldenFixture {
  name: string
  description?: string
  inputs: Parameters<typeof buildBaselineInputs>[0]
  expected: {
    diet_type?: DietType
    carbs_target_g_min?: number
    carbs_target_g_max?: number
    calorie_target_min?: number
    calorie_target_max?: number
    water_target_ml?: number
    meal_count?: number
    workout_intensity?: 'rest' | 'light' | 'moderate' | 'high'
    post_meal_walks_count?: number
    rules_fired_ids?: string[]
    doctor_flag_raised?: boolean
    supplement_count_min?: number
  }
}

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/engine')

function loadFixtures(): GoldenFixture[] {
  if (!fs.existsSync(FIXTURE_DIR)) return []
  return fs
    .readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(FIXTURE_DIR, f), 'utf8')
      return JSON.parse(raw) as GoldenFixture
    })
}

function hydrateInputs(raw: GoldenFixture['inputs']): Parameters<typeof buildBaselineInputs>[0] {
  if (!raw) return {}
  const patched: Parameters<typeof buildBaselineInputs>[0] = {
    ...(raw.patient ? { patient: raw.patient } : {}),
    ...(raw.protocol ? { protocol: raw.protocol } : {}),
    ...(raw.check_in ? { check_in: raw.check_in } : {}),
    ...(raw.recent_check_ins ? { recent_check_ins: raw.recent_check_ins } : {}),
    ...(raw.rules ? { rules: raw.rules } : {}),
  }
  // JSON fixtures cannot hold a Date directly, so the golden format uses
  // `now` as an ISO string in the raw file, but the TS override type demands
  // a Date. Callers should pass ISO and we convert here.
  const rawNow = (raw as unknown as Record<string, unknown>)['now']
  if (typeof rawNow === 'string') {
    patched.now = new Date(rawNow)
  }
  return patched
}

describe('engine golden files', () => {
  const fixtures = loadFixtures()

  it('has at least 20 fixtures (exit criteria)', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(20)
  })

  for (const fx of fixtures) {
    it(fx.name, () => {
      const inputs = buildBaselineInputs(hydrateInputs(fx.inputs))
      const result = generate(inputs)

      if (fx.expected.diet_type) {
        expect(result.plan.diet_type).toBe(fx.expected.diet_type)
      }
      if (typeof fx.expected.carbs_target_g_min === 'number') {
        expect(result.plan.carbs_target_g).toBeGreaterThanOrEqual(fx.expected.carbs_target_g_min)
      }
      if (typeof fx.expected.carbs_target_g_max === 'number') {
        expect(result.plan.carbs_target_g).toBeLessThanOrEqual(fx.expected.carbs_target_g_max)
      }
      if (typeof fx.expected.calorie_target_min === 'number') {
        expect(result.plan.calorie_target).toBeGreaterThanOrEqual(fx.expected.calorie_target_min)
      }
      if (typeof fx.expected.calorie_target_max === 'number') {
        expect(result.plan.calorie_target).toBeLessThanOrEqual(fx.expected.calorie_target_max)
      }
      if (typeof fx.expected.water_target_ml === 'number') {
        expect(result.plan.water_target_ml).toBe(fx.expected.water_target_ml)
      }
      if (typeof fx.expected.meal_count === 'number') {
        expect(result.plan.meals).toHaveLength(fx.expected.meal_count)
      }
      if (fx.expected.workout_intensity) {
        expect(result.plan.workout.intensity).toBe(fx.expected.workout_intensity)
      }
      if (typeof fx.expected.post_meal_walks_count === 'number') {
        expect(result.plan.workout.post_meal_walks).toHaveLength(fx.expected.post_meal_walks_count)
      }
      if (fx.expected.rules_fired_ids) {
        const got = result.rules_fired.map((r) => r.rule_id).sort()
        expect(got).toStrictEqual([...fx.expected.rules_fired_ids].sort())
      }
      if (typeof fx.expected.doctor_flag_raised === 'boolean') {
        expect(result.doctor_flag_raised).toBe(fx.expected.doctor_flag_raised)
      }
      if (typeof fx.expected.supplement_count_min === 'number') {
        expect(result.plan.supplements.length).toBeGreaterThanOrEqual(
          fx.expected.supplement_count_min
        )
      }
    })
  }
})
