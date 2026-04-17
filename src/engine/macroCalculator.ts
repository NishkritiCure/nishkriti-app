/**
 * Macro calculator — pure math.
 *
 * BMR: Mifflin-St Jeor (APP-ENGINE-CONTEXT.md §6.1)
 * TDEE: activity multipliers (§6.2)
 * Macro splits: per diet type (§6.4 / §17)
 * Carb adjustments: rule-driven deltas, with ABSOLUTE_MIN_G and
 *   CRITICAL_FLOOR_G floors (§6.5). Re-derives calorie_target from the
 *   adjusted macros so the invariant calorie = c*4 + p*4 + f*9 holds within
 *   rounding tolerance (§14 safety invariant 3).
 *
 * Diet type override cascade (§7) lives here so phase-b has one place to
 * own macro state transitions.
 */

import { EngineError } from '@/services/errorService'
import type {
  ActivityLevel,
  DietAction,
  DietType,
  FiredRule,
  MergedRules,
  Macros,
  Patient,
  Protocol,
  Sex,
} from './types'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const DEFAULT_CALORIE_DEFICIT = 350

/** Integer year difference between dob and reference date (floor). */
export function calculateAge(dob: string, now: Date): number {
  const born = new Date(dob + 'T00:00:00Z')
  if (Number.isNaN(born.getTime())) {
    throw new EngineError(`Invalid dob: ${dob}`, 'ENGINE_INVALID_INPUTS')
  }
  let age = now.getUTCFullYear() - born.getUTCFullYear()
  const monthDiff = now.getUTCMonth() - born.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < born.getUTCDate())) {
    age--
  }
  return age
}

export function calculateBMR(weight_kg: number, height_cm: number, age: number, sex: Sex): number {
  const common = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return sex === 'male' ? common + 5 : common - 161
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activity]
}

/**
 * Determine the effective diet type AFTER the rule override cascade.
 * Order matters — keto overrides must be checked before low_carb.
 */
export function determineEffectiveDietType(
  protocol: Protocol,
  fired: readonly FiredRule[]
): DietType {
  const ids = new Set(fired.map((r) => r.rule_id))
  if (ids.has('DR004') || ids.has('DR003') || ids.has('PC003')) return 'keto'
  if (ids.has('DR002') || ids.has('PC002')) return 'low_carb'

  // Rule-driven diet_type_override (explicit action) — last wins.
  let explicit: DietType | null = null
  for (const rule of fired) {
    for (const action of rule.diet_actions) {
      if (action.type === 'diet_type_override' && action.diet_type) {
        explicit = action.diet_type
      }
    }
  }
  return explicit ?? protocol.diet_type
}

/** Baseline macros from calorie target + diet-type split. */
export function splitMacros(
  calorieTarget: number,
  dietType: DietType,
  merged: MergedRules
): Macros {
  const split = merged.content.macro_splits[dietType]
  if (!split) {
    throw new EngineError(`No macro split for diet type ${dietType}`, 'ENGINE_INVALID_INPUTS')
  }
  const carbs_target_g = Math.round((calorieTarget * split.carbs) / 4)
  const protein_target_g = Math.round((calorieTarget * split.protein) / 4)
  const fat_target_g = Math.round((calorieTarget * split.fat) / 9)
  return {
    calorie_target: carbs_target_g * 4 + protein_target_g * 4 + fat_target_g * 9,
    carbs_target_g,
    protein_target_g,
    fat_target_g,
  }
}

/**
 * Full macro calculation pipeline:
 *   BMR → TDEE → calorie target (protocol or TDEE − deficit) → split → adjust carbs.
 */
export function calculateMacros(
  patient: Patient,
  protocol: Protocol,
  fired: readonly FiredRule[],
  merged: MergedRules,
  now: Date
): { macros: Macros; effective_diet_type: DietType } {
  const age = calculateAge(patient.dob, now)
  const bmr = calculateBMR(patient.weight_kg, patient.height_cm, age, patient.sex)
  const tdee = calculateTDEE(bmr, patient.activity_level)

  const effective_diet_type = determineEffectiveDietType(protocol, fired)
  const baselineCalories = protocol.calorie_target ?? Math.round(tdee - DEFAULT_CALORIE_DEFICIT)

  const baseline = splitMacros(baselineCalories, effective_diet_type, merged)

  // Aggregate carb deltas from fired rule diet_actions.
  const carbDelta = sumCarbDeltas(fired.flatMap((r) => r.diet_actions))
  let carbs = baseline.carbs_target_g + carbDelta

  const adj = merged.content.carb_adjustments
  carbs = Math.max(adj.ABSOLUTE_MIN_G, carbs)

  // DKA protection floor: if any critical-FBS rule fired, apply the higher floor.
  const criticalFbs = fired.some((r) => r.rule_id === 'DR004' || r.rule_id === 'PC003')
  if (criticalFbs) {
    carbs = Math.max(adj.CRITICAL_FLOOR_G, carbs)
  }

  const macros: Macros = {
    carbs_target_g: carbs,
    protein_target_g: baseline.protein_target_g,
    fat_target_g: baseline.fat_target_g,
    calorie_target: carbs * 4 + baseline.protein_target_g * 4 + baseline.fat_target_g * 9,
  }

  return { macros, effective_diet_type }
}

function sumCarbDeltas(actions: readonly DietAction[]): number {
  let total = 0
  for (const action of actions) {
    if (action.type === 'carb_delta' && typeof action.value_g === 'number') {
      total += action.value_g
    }
  }
  return total
}
