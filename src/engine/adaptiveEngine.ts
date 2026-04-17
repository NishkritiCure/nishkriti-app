/**
 * adaptiveEngine.generate — the orchestrator.
 *
 * Pipes layers → rules → macros → meals → exercise → reasoning → assembles
 * the full EngineResult envelope that phase-d's engineService will wrap with
 * {patient_id, check_in_id, plan_date} and POST to
 * /v1/daily-plans/fallback-submit.
 *
 * Synchronous + pure. No IO. Safety invariants from APP-ENGINE-CONTEXT.md §14
 * are enforced before return; any violation throws EngineError with a typed
 * code so the service layer can surface a user-safe message.
 */

import { EngineError } from '@/services/errorService'
import { mergeEngineLayers } from './engineConfig'
import { computePostMealWalks, computeWaterTarget, selectWorkout } from './exerciseSelector'
import { calculateMacros } from './macroCalculator'
import { selectAllMeals } from './mealSelector'
import { buildDoctorReasoning } from './reasoningBuilder'
import { evaluateRules } from './ruleEvaluator'
import type {
  EngineInputs,
  EngineResult,
  FiredRule,
  FiredRuleSummary,
  GeneratedPlan,
  MergedRules,
  Patient,
  PatientSupplement,
  SupplementPlan,
} from './types'

export function generate(inputs: EngineInputs): EngineResult {
  validateInputs(inputs)

  const merged = mergeEngineLayers(
    inputs.base_version,
    inputs.condition_overlays,
    inputs.patient_override,
    inputs.active_layers,
    inputs.patient.primary_condition
  )

  const fired = evaluateRules(
    {
      patient: inputs.patient,
      check_in: inputs.check_in,
      recent_check_ins: inputs.recent_check_ins,
      recent_labs: inputs.recent_labs,
      recent_vitals: inputs.recent_vitals,
      recent_cycles: inputs.recent_cycles,
      now: inputs.now,
    },
    merged
  )

  const { macros, effective_diet_type } = calculateMacros(
    inputs.patient,
    inputs.protocol,
    fired,
    merged,
    inputs.now
  )

  const meals = selectAllMeals(
    merged.content.meal_slots,
    inputs.libraries.meals,
    effective_diet_type,
    inputs.patient,
    inputs.check_in,
    fired
  )

  const workout = selectWorkout(
    inputs.patient,
    inputs.check_in,
    fired,
    inputs.libraries.exercises,
    merged
  )

  // If workout isn't a rest-day plan, its post-meal walks came from the rule-
  // driven pipeline; otherwise the rest-day plan already supplies a conservative
  // walk. Use the workout's walks as-is. Make sure the overall walks list is
  // non-empty when the engine's walk rules would add one outside rest day.
  const walks =
    workout.intensity === 'rest'
      ? workout.post_meal_walks
      : [...computePostMealWalks(inputs.patient, inputs.check_in, merged)]
  const workoutWithWalks =
    workout.intensity === 'rest' ? workout : { ...workout, post_meal_walks: walks }

  const supplements = buildSupplements(inputs.patient_supplements, inputs.patient)

  const water_target_ml = computeWaterTarget(inputs.patient, inputs.check_in, merged)

  const reasoning = buildDoctorReasoning(
    fired,
    effective_diet_type,
    inputs.protocol,
    inputs.check_in
  )

  const plan: GeneratedPlan = {
    diet_type: effective_diet_type,
    calorie_target: macros.calorie_target,
    carbs_target_g: macros.carbs_target_g,
    protein_target_g: macros.protein_target_g,
    fat_target_g: macros.fat_target_g,
    water_target_ml,
    meals,
    workout: workoutWithWalks,
    supplements,
    supplement_note: buildSupplementNote(fired),
  }

  enforceSafetyInvariants(plan, merged, fired)

  const rules_fired: FiredRuleSummary[] = fired.map((r) => ({
    rule_id: r.rule_id,
    severity: r.severity,
    notify_doctor: r.notify_doctor,
    message: r.message,
  }))

  const doctor_flag = fired.filter((r) => r.notify_doctor)
  const result: EngineResult = {
    plan,
    reasoning,
    rules_fired,
    engine_version_snapshot: merged.version_snapshot,
    doctor_flag_raised: doctor_flag.length > 0,
  }
  if (doctor_flag.length > 0) {
    result.doctor_flag_reason = doctor_flag.map((r) => `${r.rule_id}: ${r.message}`).join(' · ')
  }
  return result
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function validateInputs(inputs: EngineInputs): void {
  if (!inputs.patient || !inputs.patient.id) {
    throw new EngineError('Missing patient', 'ENGINE_INVALID_INPUTS')
  }
  if (!inputs.protocol || inputs.protocol.patient_id !== inputs.patient.id) {
    throw new EngineError('Missing or mismatched protocol', 'ENGINE_INVALID_INPUTS')
  }
  if (!inputs.check_in || !inputs.check_in.check_in_date) {
    throw new EngineError('Missing check-in', 'ENGINE_INVALID_INPUTS')
  }
  if (!inputs.base_version) {
    throw new EngineError('Missing engine base version', 'ENGINE_NO_BASE_VERSION')
  }
  if (!inputs.active_layers || inputs.active_layers.patient_id !== inputs.patient.id) {
    throw new EngineError('Missing or mismatched active layers', 'ENGINE_INVALID_INPUTS')
  }
}

function buildSupplements(
  active: readonly PatientSupplement[],
  _patient: Patient
): SupplementPlan[] {
  return active
    .filter((s) => s.is_active)
    .map((s) => ({
      supplement_id: s.id,
      name: s.name,
      dose: s.dose,
      timing: s.timing,
      with_food: s.with_food,
    }))
}

function buildSupplementNote(fired: readonly FiredRule[]): string | null {
  const notes: string[] = []
  for (const rule of fired) {
    for (const action of rule.diet_actions) {
      if (action.type === 'note' && action.text) notes.push(action.text)
    }
  }
  return notes.length === 0 ? null : notes.join(' ')
}

export function enforceSafetyInvariants(
  plan: GeneratedPlan,
  merged: MergedRules,
  fired: readonly FiredRule[]
): void {
  const { ABSOLUTE_MIN_G, CRITICAL_FLOOR_G } = merged.content.carb_adjustments

  if (plan.carbs_target_g < ABSOLUTE_MIN_G) {
    throw new EngineError(
      `carbs ${plan.carbs_target_g}g below absolute minimum ${ABSOLUTE_MIN_G}g`,
      'ENGINE_SAFETY_INVARIANT_VIOLATED'
    )
  }

  const criticalFbs = fired.some((r) => r.rule_id === 'DR004' || r.rule_id === 'PC003')
  if (criticalFbs && plan.carbs_target_g < CRITICAL_FLOOR_G) {
    throw new EngineError(
      `carbs ${plan.carbs_target_g}g below DKA-protection floor ${CRITICAL_FLOOR_G}g`,
      'ENGINE_SAFETY_INVARIANT_VIOLATED'
    )
  }

  const derived = plan.carbs_target_g * 4 + plan.protein_target_g * 4 + plan.fat_target_g * 9
  if (Math.abs(plan.calorie_target - derived) > 5) {
    throw new EngineError(
      `calorie_target ${plan.calorie_target} drifted from macros (derived ${derived})`,
      'ENGINE_SAFETY_INVARIANT_VIOLATED'
    )
  }

  const fbsCritical = fired.some((r) => ['DR004', 'DR005'].includes(r.rule_id))
  if (fbsCritical && plan.workout.intensity !== 'rest') {
    throw new EngineError(
      'critical FBS rule fired but workout.intensity is not rest',
      'ENGINE_SAFETY_INVARIANT_VIOLATED'
    )
  }

  if (plan.meals.length !== merged.content.meal_slots.length) {
    throw new EngineError(
      `meals.length (${plan.meals.length}) !== configured slot count`,
      'ENGINE_SAFETY_INVARIANT_VIOLATED'
    )
  }
}
