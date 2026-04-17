/**
 * Meal selector — pure, deterministic.
 *
 * Per APP-ENGINE-CONTEXT.md §9 the selector is a 12-step filter pipeline per
 * slot with a 3-level fallback chain and a patient-seeded SHA-256 for variety
 * (same patient+date+slot → same pick; different patients see different meals).
 */

import { sha256 } from 'js-sha256'

import { EngineError } from '@/services/errorService'
import type {
  DailyCheckIn,
  DietType,
  FiredRule,
  MealLibraryRow,
  MealPlanEntry,
  MealSlot,
  Patient,
} from './types'

const FRUIT_INGREDIENTS = [
  'apple',
  'banana',
  'orange',
  'grape',
  'papaya',
  'mango',
  'pear',
  'watermelon',
  'pineapple',
  'fruit',
]

export function selectMealForSlot(
  slot: MealSlot,
  library: readonly MealLibraryRow[],
  effectiveDietType: DietType,
  patient: Patient,
  checkIn: DailyCheckIn,
  fired: readonly FiredRule[]
): MealPlanEntry {
  const firedIds = new Set(fired.map((r) => r.rule_id))
  const isCritical = fired.some((r) => r.severity === 'critical')
  const hasHighFbsRule = ['DR002', 'DR003', 'DR004', 'PC002', 'PC003'].some((id) =>
    firedIds.has(id)
  )
  const isHypoRule = firedIds.has('DR005')

  // Stage 1 — by slot.
  const inSlot = library.filter((m) => m.slots.includes(slot))
  if (inSlot.length === 0) {
    throw new EngineError(`No meals in library for slot ${slot}`, 'ENGINE_NO_MEALS_IN_CATEGORY')
  }

  // Stage 2 — by diet type.
  let candidates = inSlot.filter((m) => m.diet_types.includes(effectiveDietType))

  // Stage 3 — veg / vegan / egg / jain / non_veg.
  candidates = filterByDietPreference(candidates, patient.diet_preference)

  // Stage 4 — allergies + dislikes.
  candidates = candidates.filter((m) => !hasBannedIngredient(m, patient))

  // Stage 5 — portability on travel days.
  if (checkIn.requests?.travelDay) {
    candidates = candidates.filter((m) => m.portability === 'high')
  }

  // Stage 6 — low-GI only when critical + breakfast.
  if (isCritical && slot === 'breakfast') {
    candidates = candidates.filter((m) => m.gi === 'low' || m.gi === 'medium')
  }

  // Stage 7 — mid-morning carb floor on hypoglycemia.
  if (slot === 'mid_morning' && isHypoRule) {
    candidates = candidates.filter((m) => m.macros.carbs > 15)
  }

  // Stage 8 — filter out fruit on mid-morning for high-FBS days.
  if (slot === 'mid_morning' && hasHighFbsRule) {
    candidates = candidates.filter((m) => !mentionsFruit(m))
  }

  // Stage 9 — cuisine preference (soft — drops if exhausted).
  let preferred = candidates
  if (patient.cuisine_preference.length > 0) {
    const cuisineNarrowed = candidates.filter(
      (m) => m.cuisine !== null && patient.cuisine_preference.includes(m.cuisine)
    )
    if (cuisineNarrowed.length > 0) preferred = cuisineNarrowed
  }

  // Stage 10 — fallback chain. inSlot is guaranteed non-empty by stage 1, so
  // the chain is: preferred → same-slot veg-respected → same-slot anything.
  const finalCandidates = fallbackChain(preferred, inSlot, patient)

  // Stage 11 — deterministic patient-seeded pick.
  const idx = patientSeededIndex(patient.id, checkIn.check_in_date, slot, finalCandidates.length)
  const item = finalCandidates[idx] as MealLibraryRow

  // Stage 12 — slot-level adjustments text.
  const adjustments = adjustmentsFor(slot, firedIds, isHypoRule, hasHighFbsRule)

  return adjustments === undefined ? { slot, item } : { slot, item, adjustments }
}

export function selectAllMeals(
  slots: readonly MealSlot[],
  library: readonly MealLibraryRow[],
  effectiveDietType: DietType,
  patient: Patient,
  checkIn: DailyCheckIn,
  fired: readonly FiredRule[]
): MealPlanEntry[] {
  return slots.map((slot) =>
    selectMealForSlot(slot, library, effectiveDietType, patient, checkIn, fired)
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function filterByDietPreference(
  meals: readonly MealLibraryRow[],
  pref: Patient['diet_preference']
): MealLibraryRow[] {
  switch (pref) {
    case 'veg':
    case 'jain':
      return meals.filter((m) => m.is_veg)
    case 'egg':
      return meals.filter((m) => m.is_veg || m.is_egg)
    case 'vegan':
      return meals.filter((m) => m.is_veg && !m.has_dairy)
    case 'non_veg':
      return [...meals]
  }
}

function hasBannedIngredient(meal: MealLibraryRow, patient: Patient): boolean {
  const banned = new Set(
    [...patient.allergies, ...patient.disliked_foods].map((x) => x.toLowerCase())
  )
  if (banned.size === 0) return false
  return meal.ingredients.some((ing) => banned.has(ing.name.toLowerCase()))
}

function mentionsFruit(meal: MealLibraryRow): boolean {
  const names = meal.ingredients.map((i) => i.name.toLowerCase())
  return names.some((n) => FRUIT_INGREDIENTS.some((f) => n.includes(f)))
}

function fallbackChain(
  preferred: readonly MealLibraryRow[],
  inSlot: readonly MealLibraryRow[],
  patient: Patient
): readonly MealLibraryRow[] {
  if (preferred.length > 0) return preferred

  // Level 1 — drop diet-type / cuisine / allergy / GI filters, keep slot +
  // broad veg preference (non_veg sees everything).
  const level1 = inSlot.filter((m) => {
    if (patient.diet_preference === 'non_veg') return true
    return m.is_veg
  })
  if (level1.length > 0) return level1

  // Level 2 — ultimate safety net: any meal in the slot (even non-veg in
  // emergency; the doctor will edit before approval).
  return inSlot
}

export function patientSeededIndex(
  patientId: string,
  date: string,
  slot: string,
  length: number
): number {
  if (length <= 0) return 0
  const hash = sha256(`${patientId}::${date}::${slot}`)
  const head = hash.slice(0, 8)
  const n = parseInt(head, 16)
  return n % length
}

function adjustmentsFor(
  slot: MealSlot,
  firedIds: ReadonlySet<string>,
  isHypo: boolean,
  hasHighFbs: boolean
): string | undefined {
  if (slot === 'mid_morning' && hasHighFbs) {
    return 'Fruit removed today — FBS elevated. Nuts/curd only.'
  }
  if (slot === 'mid_morning' && isHypo) {
    return 'Complex carbs required — hypoglycemia protocol.'
  }
  if (slot === 'dinner' && (firedIds.has('DR002') || firedIds.has('DR003'))) {
    return 'No roti tonight — no carbs after 6:30pm with elevated FBS.'
  }
  return undefined
}
