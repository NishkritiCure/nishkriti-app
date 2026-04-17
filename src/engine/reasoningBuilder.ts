/**
 * Reasoning text builder.
 *
 * The engine emits one string per call: a doctor-facing narrative that
 * concatenates the reasoning_template of each fired rule, plus a closing
 * summary sentence for diet-type overrides.
 *
 * Locale-free by design — no Intl, no toLocaleString. Parity with the Python
 * implementation depends on byte-level output stability.
 */

import type { DietType, FiredRule, Protocol, DailyCheckIn } from './types'

export function buildDoctorReasoning(
  fired: readonly FiredRule[],
  effectiveDietType: DietType,
  protocol: Protocol,
  checkIn: DailyCheckIn
): string {
  if (fired.length === 0) {
    return 'All markers in range today. Continuing with the current protocol. Maintain the plan as-is.'
  }

  const sentences: string[] = fired.map((r) => r.message)

  if (effectiveDietType !== protocol.diet_type) {
    sentences.push(`Diet type switched to ${effectiveDietType} for today based on the above.`)
  }

  if (checkIn.message_for_doctor && checkIn.message_for_doctor.trim().length > 0) {
    sentences.push(`Patient note: ${checkIn.message_for_doctor.trim()}`)
  }

  return sentences.join(' ')
}

export function buildPatientReasoning(
  fired: readonly FiredRule[],
  effectiveDietType: DietType,
  protocol: Protocol
): string {
  if (fired.length === 0) {
    return "Today's plan looks on-track. Stay consistent and keep logging honestly."
  }

  const hasCritical = fired.some((r) => r.severity === 'critical')
  const hasHigh = fired.some((r) => r.severity === 'high')
  const diff = effectiveDietType !== protocol.diet_type

  if (hasCritical) {
    return 'Your readings need a careful day. Follow the plan exactly, keep movement light, and message your doctor if anything worsens.'
  }

  if (hasHigh) {
    return diff
      ? `Your plan has been adjusted — diet shifted to ${humanDietType(effectiveDietType)} to help today.`
      : 'Your plan has been adjusted based on your check-in. Stay hydrated and follow the updated meals.'
  }

  return 'Small adjustments today based on your check-in. Stick with the plan and keep logging.'
}

export function humanDietType(dt: DietType): string {
  switch (dt) {
    case 'low_carb':
      return 'lower-carb'
    case 'keto':
      return 'ketogenic'
    case 'high_protein':
      return 'high-protein'
    case 'maintenance':
      return 'maintenance'
    case 'anti_inflammatory':
      return 'anti-inflammatory'
    case 'calorie_deficit':
      return 'calorie-deficit'
    case 'carb_cycling':
      return 'carb-cycling'
    case 'high_carb':
      return 'higher-carb'
    case 'high_probiotic':
      return 'gut-friendly'
    case 'frozen_carb':
      return 'frozen-carb technique'
  }
}
