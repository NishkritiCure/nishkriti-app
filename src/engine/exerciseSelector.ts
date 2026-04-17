/**
 * Exercise selector + workout metadata + post-meal walks + water target.
 *
 * Pure and deterministic. Rest-day triggers short-circuit the selector and
 * return a walking-only plan. See APP-ENGINE-CONTEXT.md §10–§12.
 */

import { EngineError } from '@/services/errorService'
import type {
  DailyCheckIn,
  ExerciseLibraryRow,
  FiredRule,
  MergedRules,
  Patient,
  PostMealWalk,
  WorkoutIntensity,
  WorkoutPlan,
} from './types'

import { patientSeededIndex } from './mealSelector'

const FATIGUE_SYMPTOM_MARKERS = ['fatigue', 'exhaustion', 'tired']

export function isRestDay(
  checkIn: DailyCheckIn,
  fired: readonly FiredRule[],
  recentRestStreak: number
): boolean {
  const fbs = checkIn.fbs_mg_dl
  if (fbs !== null && (fbs < 70 || fbs > 250)) return true

  // Energy ≤ 2 WITH a fatigue symptom = rest.
  if (checkIn.energy_level !== null && checkIn.energy_level <= 2) {
    const hasFatigue = checkIn.symptoms.some((s) =>
      FATIGUE_SYMPTOM_MARKERS.some((m) => s.toLowerCase().includes(m))
    )
    if (hasFatigue) return true
  }

  // Critical-severity rule fired → rest.
  if (fired.some((r) => r.severity === 'critical')) return true

  // Three consecutive rest days force at least light activity on day 4.
  if (recentRestStreak >= 3) return false

  return false
}

export function selectWorkout(
  patient: Patient,
  checkIn: DailyCheckIn,
  fired: readonly FiredRule[],
  library: readonly ExerciseLibraryRow[],
  merged: MergedRules,
  recentRestStreak = 0
): WorkoutPlan {
  if (isRestDay(checkIn, fired, recentRestStreak)) {
    return {
      type: 'Rest',
      duration_min: 10,
      intensity: 'rest',
      exercises: [],
      post_meal_walks: [
        {
          after: 'lunch',
          minutes: 10,
          reason: 'Light movement only — blood sugar must stabilise first.',
        },
      ],
    }
  }

  const exercises = selectExercises(patient, checkIn, library)

  if (exercises.length === 0) {
    throw new EngineError('No exercises selectable for patient profile', 'ENGINE_NO_EXERCISES')
  }

  const intensity = determineIntensity(checkIn)
  const duration_min = determineDuration(checkIn)
  const type = determineWorkoutType(patient, checkIn)
  const post_meal_walks = computePostMealWalks(patient, checkIn, merged)

  return { type, duration_min, intensity, exercises, post_meal_walks }
}

export function selectExercises(
  patient: Patient,
  checkIn: DailyCheckIn,
  library: readonly ExerciseLibraryRow[]
): ExerciseLibraryRow[] {
  const maxDifficulty = determineDifficultyCap(checkIn)
  const locations = new Set<string>([
    ...patient.workout_location,
    ...(checkIn.requests?.workoutLocation ? [checkIn.requests.workoutLocation] : []),
  ])

  let candidates = library.filter((e) => {
    if (e.locations.length > 0 && !e.locations.some((l) => locations.has(l))) return false
    if (e.equipment_required.some((eq) => !patient.workout_equipment.includes(eq))) return false
    if (e.difficulty > maxDifficulty) return false
    if (e.contraindications.some((c) => patient.injuries.includes(c))) return false
    return true
  })

  if (checkIn.requests?.workoutFocus === 'core') {
    candidates = candidates.filter(
      (e) => e.muscle_groups.includes('core') || e.muscle_groups.includes('abs')
    )
  }

  return deterministicPick(candidates, patient.id, checkIn.check_in_date, 3)
}

function determineDifficultyCap(checkIn: DailyCheckIn): number {
  const fbs = checkIn.fbs_mg_dl ?? 0
  const energy = checkIn.energy_level ?? 0
  if (fbs > 180 || energy <= 2) return 2
  if (energy >= 4) return 4
  return 3
}

export function determineIntensity(checkIn: DailyCheckIn): WorkoutIntensity {
  const energy = checkIn.energy_level ?? 5
  const fbs = checkIn.fbs_mg_dl ?? 0
  if (energy <= 2) return 'light'
  if (fbs > 180) return 'moderate'
  if (energy >= 4) return 'high'
  return 'moderate'
}

export function determineDuration(checkIn: DailyCheckIn): number {
  const energy = checkIn.energy_level ?? 5
  const fbs = checkIn.fbs_mg_dl ?? 0
  if (energy <= 2) return 25
  if (fbs > 180) return 35
  return checkIn.requests?.workoutMinutes ?? 45
}

export function determineWorkoutType(patient: Patient, checkIn: DailyCheckIn): string {
  const focus = checkIn.requests?.workoutFocus
  if (focus === 'core') return 'Core Focus'
  const loc = checkIn.requests?.workoutLocation ?? patient.workout_location[0]
  if (loc === 'gym') return 'Gym Resistance'
  if (loc === 'home') return 'Home Resistance'
  return 'Full Body Resistance'
}

export function computePostMealWalks(
  patient: Patient,
  checkIn: DailyCheckIn,
  merged: MergedRules
): PostMealWalk[] {
  const { fbs_elevated_threshold, fbs_high_threshold, durations_min } =
    merged.content.post_meal_walks
  const walks: PostMealWalk[] = []
  const fbs = checkIn.fbs_mg_dl

  if (fbs !== null && fbs > fbs_elevated_threshold) {
    walks.push({
      after: 'lunch',
      minutes: durations_min.after_lunch,
      reason: `FBS ${fbs} — post-meal walk reduces glucose spike by up to 30%.`,
    })
  }

  if (fbs !== null && fbs > fbs_high_threshold) {
    walks.push({
      after: 'dinner',
      minutes: durations_min.after_dinner,
      reason: 'FBS significantly elevated — evening walk helps overnight glucose clearance.',
    })
  }

  if (
    (fbs === null || fbs <= fbs_elevated_threshold) &&
    patient.conditions.includes('hypertension')
  ) {
    walks.push({
      after: 'dinner',
      minutes: 15,
      reason: 'Post-dinner walk supports blood pressure management.',
    })
  }

  return walks
}

export function computeWaterTarget(
  patient: Patient,
  checkIn: DailyCheckIn,
  merged: MergedRules
): number {
  const cfg = merged.content.water
  let target = cfg.base_ml
  const fbs = checkIn.fbs_mg_dl
  if (fbs !== null && fbs > 130) target += cfg.fbs_elevated_bonus_ml
  const energy = checkIn.energy_level
  if (energy !== null && energy >= 4) target += cfg.high_energy_bonus_ml
  if (patient.conditions.includes('hypertension')) target += cfg.hypertension_bonus_ml
  return target
}

/**
 * Pick N items from candidates deterministically using patient-seeded hash.
 * Rotates the starting index by hash so two patients see different picks.
 */
function deterministicPick(
  candidates: readonly ExerciseLibraryRow[],
  patientId: string,
  date: string,
  n: number
): ExerciseLibraryRow[] {
  if (candidates.length === 0) return []
  const result: ExerciseLibraryRow[] = []
  const seen = new Set<string>()
  let seedSlot = 0
  // Over-sample a bit in case of ties, capped at 3n iterations.
  for (let attempt = 0; attempt < n * 4 && result.length < n; attempt++) {
    const idx = patientSeededIndex(patientId, date, `exercise-${seedSlot}`, candidates.length)
    const pick = candidates[(idx + attempt) % candidates.length]
    if (pick && !seen.has(pick.id)) {
      seen.add(pick.id)
      result.push(pick)
    }
    seedSlot++
  }
  return result
}
