import { describe, expect, it } from 'vitest'

import {
  buildDoctorReasoning,
  buildPatientReasoning,
  humanDietType,
} from '@/engine/reasoningBuilder'
import type { DietType, FiredRule } from '@/engine/types'

import { makeCheckIn } from './helpers/makeCheckIn'
import { makeProtocol } from './helpers/makePatient'

function firedRule(overrides: Partial<FiredRule> = {}): FiredRule {
  return {
    rule_id: 'DR001',
    severity: 'low',
    notify_doctor: false,
    message: 'FBS 145 above target.',
    diet_actions: [],
    workout_actions: [],
    ...overrides,
  }
}

describe('buildDoctorReasoning', () => {
  it('returns the "all markers in range" sentence when no rules fired', () => {
    const out = buildDoctorReasoning(
      [],
      'low_carb',
      makeProtocol({ diet_type: 'low_carb' }),
      makeCheckIn()
    )
    expect(out).toContain('All markers in range')
  })

  it('concatenates fired rule messages', () => {
    const out = buildDoctorReasoning(
      [firedRule({ message: 'FBS 145 above target.' })],
      'low_carb',
      makeProtocol({ diet_type: 'low_carb' }),
      makeCheckIn()
    )
    expect(out).toBe('FBS 145 above target.')
  })

  it('adds a diet-switch sentence when effective type differs from protocol', () => {
    const out = buildDoctorReasoning(
      [firedRule({ rule_id: 'DR002', message: 'FBS 145.' })],
      'keto',
      makeProtocol({ diet_type: 'low_carb' }),
      makeCheckIn()
    )
    expect(out).toContain('Diet type switched to keto')
  })

  it('appends patient-note when check-in has a message_for_doctor', () => {
    const out = buildDoctorReasoning(
      [firedRule()],
      'low_carb',
      makeProtocol({ diet_type: 'low_carb' }),
      makeCheckIn({ message_for_doctor: ' please advise. ' })
    )
    expect(out).toContain('Patient note: please advise.')
  })

  it('does not append patient-note when the message is whitespace only', () => {
    const out = buildDoctorReasoning(
      [firedRule()],
      'low_carb',
      makeProtocol({ diet_type: 'low_carb' }),
      makeCheckIn({ message_for_doctor: '   ' })
    )
    expect(out).not.toContain('Patient note')
  })
})

describe('buildPatientReasoning', () => {
  it('default on-track when no rules fired', () => {
    expect(
      buildPatientReasoning([], 'low_carb', makeProtocol({ diet_type: 'low_carb' }))
    ).toContain('on-track')
  })

  it('critical severity returns the "careful day" sentence', () => {
    expect(
      buildPatientReasoning(
        [firedRule({ severity: 'critical' })],
        'low_carb',
        makeProtocol({ diet_type: 'low_carb' })
      )
    ).toContain('careful day')
  })

  it('high severity with diet change mentions the new diet type in plain English', () => {
    expect(
      buildPatientReasoning(
        [firedRule({ severity: 'high' })],
        'keto',
        makeProtocol({ diet_type: 'low_carb' })
      )
    ).toContain('ketogenic')
  })

  it('high severity without diet change still gives an "adjusted" sentence', () => {
    expect(
      buildPatientReasoning(
        [firedRule({ severity: 'high' })],
        'low_carb',
        makeProtocol({ diet_type: 'low_carb' })
      )
    ).toContain('adjusted based on your check-in')
  })

  it('low severity: small adjustments language', () => {
    expect(
      buildPatientReasoning(
        [firedRule({ severity: 'low' })],
        'low_carb',
        makeProtocol({ diet_type: 'low_carb' })
      )
    ).toContain('Small adjustments')
  })
})

describe('humanDietType', () => {
  it.each([
    ['low_carb', 'lower-carb'],
    ['keto', 'ketogenic'],
    ['high_protein', 'high-protein'],
    ['maintenance', 'maintenance'],
    ['anti_inflammatory', 'anti-inflammatory'],
    ['calorie_deficit', 'calorie-deficit'],
    ['carb_cycling', 'carb-cycling'],
    ['high_carb', 'higher-carb'],
    ['high_probiotic', 'gut-friendly'],
    ['frozen_carb', 'frozen-carb technique'],
  ] as const)('%s → %s', (dt, label) => {
    expect(humanDietType(dt as DietType)).toBe(label)
  })
})
