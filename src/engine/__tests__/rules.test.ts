import { describe, expect, it } from 'vitest'

import {
  checkOperator,
  evaluateAdherenceRules,
  evaluateBpRules,
  evaluateEnergyRules,
  evaluateFbsRules,
  evaluatePostMealRules,
  evaluateRequestRules,
  evaluateRules,
  evaluateSpecialRules,
  evaluateSymptomRules,
  evaluateWeightRules,
  getMetricValue,
  isDataSourceAvailable,
  renderTemplate,
  ruleAppliesToPatient,
} from '@/engine/ruleEvaluator'
import type { MergedRules } from '@/engine/types'

import { makeActiveLayers, makeBaseContent, makeRule } from './helpers/makeLayers'
import {
  FIXED_NOW,
  makeCheckIn,
  makeCtx,
  makeCycle,
  makeHistory,
  makeLab,
  makeVital,
} from './helpers/makeCheckIn'
import { makePatient } from './helpers/makePatient'

function withRules(rules: ReturnType<typeof makeRule>[]): MergedRules {
  return {
    content: makeBaseContent({ rules }),
    version_snapshot: {
      base_version_id: makeActiveLayers().base_version_id,
      condition_overlay_version_ids: [],
      override_version_id: null,
    },
  }
}

// ─── Operator boundary tests ────────────────────────────────────────────────

describe('checkOperator — boundaries', () => {
  it.each([
    ['gt', 10, 9, true],
    ['gt', 10, 10, false],
    ['gt', 10, 11, false],
    ['gte', 10, 9, true],
    ['gte', 10, 10, true],
    ['gte', 10, 11, false],
    ['lt', 10, 11, true],
    ['lt', 10, 10, false],
    ['lt', 10, 9, false],
    ['lte', 10, 11, true],
    ['lte', 10, 10, true],
    ['lte', 10, 9, false],
    ['eq', 10, 10, true],
    ['eq', 10, 9, false],
  ] as const)('%s %d vs threshold %d → %s', (op, value, threshold, expected) => {
    expect(checkOperator(value, op, threshold)).toBe(expected)
  })

  it('between [101,130]: 100 false, 101 true, 130 true, 131 false', () => {
    expect(checkOperator(100, 'between', [101, 130])).toBe(false)
    expect(checkOperator(101, 'between', [101, 130])).toBe(true)
    expect(checkOperator(130, 'between', [101, 130])).toBe(true)
    expect(checkOperator(131, 'between', [101, 130])).toBe(false)
  })
})

// ─── FBS band boundary tests — the canonical catalog from TESTING-STRATEGY §3.3 ───

describe('FBS bands — boundary values per TESTING-STRATEGY §3.3', () => {
  // Rule set mirrors the six FBS bands from FUNCTIONAL-REQUIREMENTS §5.4.
  const fbsRules = [
    makeRule({ id: 'DR005', operator: 'lt', threshold: 70, severity: 'critical', window_days: 1 }),
    makeRule({
      id: 'DR001',
      operator: 'between',
      threshold: [101, 130] as const,
      severity: 'low',
      window_days: 1,
    }),
    makeRule({
      id: 'DR002',
      operator: 'between',
      threshold: [131, 180] as const,
      severity: 'high',
      window_days: 1,
    }),
    makeRule({
      id: 'DR003',
      operator: 'between',
      threshold: [181, 250] as const,
      severity: 'high',
      notify_doctor: true,
      window_days: 1,
    }),
    makeRule({
      id: 'DR004',
      operator: 'gt',
      threshold: 250,
      severity: 'critical',
      notify_doctor: true,
      window_days: 1,
    }),
  ]
  const merged = withRules(fbsRules)

  it.each([
    [69, ['DR005']],
    [70, []],
    [71, []],
    [99, []],
    [100, []],
    [101, ['DR001']],
    [129, ['DR001']],
    [130, ['DR001']],
    [131, ['DR002']],
    [179, ['DR002']],
    [180, ['DR002']],
    [181, ['DR003']],
    [249, ['DR003']],
    [250, ['DR003']],
    [251, ['DR004']],
  ] as const)('FBS %d fires %o', (fbs, expectedIds) => {
    const ctx = makeCtx({ check_in: makeCheckIn({ fbs_mg_dl: fbs }) })
    const fired = evaluateFbsRules(ctx, merged)
    expect(fired.map((r) => r.rule_id).sort()).toStrictEqual([...expectedIds].sort())
  })

  it('when FBS is null, no band fires', () => {
    const ctx = makeCtx({ check_in: makeCheckIn({ fbs_mg_dl: null }) })
    expect(evaluateFbsRules(ctx, merged)).toHaveLength(0)
  })

  it('multi-day FBS rule uses the min across window', () => {
    const rule = makeRule({
      id: 'DR002-3d',
      operator: 'gt',
      threshold: 130,
      window_days: 3,
    })
    // Today 150, yesterday 120, day-before 140 → min = 120 → does NOT fire
    const merged3 = withRules([rule])
    const history = makeHistory(2, (d) => ({ fbs_mg_dl: d === 1 ? 120 : 140 }))
    const ctx = makeCtx({
      check_in: makeCheckIn({ fbs_mg_dl: 150 }),
      recent_check_ins: history,
    })
    expect(evaluateFbsRules(ctx, merged3)).toHaveLength(0)
  })
})

// ─── Weight delta boundaries (rules 19–25 band) ─────────────────────────────

describe('Weight delta bands — boundaries per TESTING-STRATEGY §3.3', () => {
  const target = makeRule({
    id: 'OB001',
    metric: 'weight',
    operator: 'between',
    threshold: [-1.0, -0.3] as const, // weight_kg delta: 0.3–1.0 kg loss over window
    severity: 'positive',
    window_days: 7,
  })
  const merged = withRules([target])

  it.each([
    [-0.29, false],
    [-0.3, true],
    [-0.99, true],
    [-1.0, true],
    [-1.01, false],
  ] as const)('delta %f kg → fires %s', (delta, shouldFire) => {
    // today weight is 70, past weight is 70 - delta (so delta = today - past)
    const history = makeHistory(7, (d) => ({ weight_kg: d === 7 ? 70 - delta : null }))
    const ctx = makeCtx({
      check_in: makeCheckIn({ weight_kg: 70 }),
      recent_check_ins: history,
    })
    const fired = evaluateWeightRules(ctx, merged)
    expect(fired.length === 1).toBe(shouldFire)
  })

  it('null today weight → no fire', () => {
    const ctx = makeCtx({ check_in: makeCheckIn({ weight_kg: null }), recent_check_ins: [] })
    expect(evaluateWeightRules(ctx, merged)).toHaveLength(0)
  })

  it('no history past window → no fire', () => {
    const ctx = makeCtx({
      check_in: makeCheckIn({ weight_kg: 70 }),
      recent_check_ins: [],
    })
    expect(evaluateWeightRules(ctx, merged)).toHaveLength(0)
  })
})

// ─── Energy boundaries ──────────────────────────────────────────────────────

describe('Energy rule boundaries', () => {
  const rule = makeRule({
    id: 'DR011',
    metric: 'energy',
    operator: 'lte',
    threshold: 2,
    window_days: 3,
    severity: 'medium',
  })
  const merged = withRules([rule])

  it.each([
    [1, true],
    [2, true],
    [3, false],
    [4, false],
  ] as const)('energy %d (3 consecutive) → fires %s', (lvl, shouldFire) => {
    const history = makeHistory(2, () => ({ energy_level: lvl }))
    const ctx = makeCtx({
      check_in: makeCheckIn({ energy_level: lvl }),
      recent_check_ins: history,
    })
    expect(evaluateEnergyRules(ctx, merged).length === 1).toBe(shouldFire)
  })

  it('if any day in window exceeds threshold, min still <= fires', () => {
    // energy [1, 5, 5] → min=1 → fires
    const ctx = makeCtx({
      check_in: makeCheckIn({ energy_level: 1 }),
      recent_check_ins: makeHistory(2, () => ({ energy_level: 5 })),
    })
    expect(evaluateEnergyRules(ctx, merged)).toHaveLength(1)
  })

  it('null energy across window → no fire', () => {
    const ctx = makeCtx({
      check_in: makeCheckIn({ energy_level: null }),
      recent_check_ins: makeHistory(2, () => ({ energy_level: null })),
    })
    expect(evaluateEnergyRules(ctx, merged)).toHaveLength(0)
  })
})

// ─── Sleep boundaries (grouped with energy) ─────────────────────────────────

describe('Sleep rule boundaries', () => {
  const rule = makeRule({
    id: 'HT030',
    metric: 'sleep',
    operator: 'lt',
    threshold: 6,
    window_days: 3,
    severity: 'medium',
    condition: 'hypothyroid',
  })
  const merged = withRules([rule])

  it.each([
    [5.9, true],
    [6, false],
    [6.1, false],
  ])('sleep %f → fires %s', (hrs, shouldFire) => {
    const patient = makePatient({
      conditions: ['hypothyroid'],
      primary_condition: 'hypothyroid',
    })
    const ctx = makeCtx({
      patient,
      check_in: makeCheckIn({ sleep_hours: hrs }),
      recent_check_ins: makeHistory(2, () => ({ sleep_hours: hrs })),
    })
    expect(evaluateEnergyRules(ctx, merged).length === 1).toBe(shouldFire)
  })
})

// ─── BP boundaries — Stage 1/2/Crisis per SBP ──────────────────────────────

describe('BP systolic boundaries', () => {
  const stage2 = makeRule({
    id: 'HN002',
    condition: 'hypertension',
    metric: 'bp_systolic',
    operator: 'between',
    threshold: [141, 160] as const,
    window_days: 2,
    severity: 'high',
    data_source: 'check_in', // already-derived via vitals table
  })
  const crisis = makeRule({
    id: 'HN003',
    condition: 'hypertension',
    metric: 'bp_systolic',
    operator: 'gt',
    threshold: 160,
    window_days: 1,
    severity: 'critical',
    notify_doctor: true,
    data_source: 'check_in',
  })
  const merged = withRules([stage2, crisis])

  it.each([
    [140, []],
    [141, ['HN002']],
    [160, ['HN002']],
    [161, ['HN003']],
    [200, ['HN003']],
  ])('SBP %d avg → fires %o', (val, expected) => {
    const patient = makePatient({
      conditions: ['hypertension'],
      primary_condition: 'hypertension',
    })
    const ctx = makeCtx({
      patient,
      recent_vitals: [makeVital({ value_primary: val })],
    })
    const ids = evaluateBpRules(ctx, merged)
      .map((r) => r.rule_id)
      .sort()
    expect(ids).toStrictEqual([...expected].sort())
  })

  it('no BP data → no fire', () => {
    const patient = makePatient({
      conditions: ['hypertension'],
      primary_condition: 'hypertension',
    })
    const ctx = makeCtx({ patient, recent_vitals: [] })
    expect(evaluateBpRules(ctx, merged)).toHaveLength(0)
  })

  it('uses the average across the window', () => {
    const patient = makePatient({
      conditions: ['hypertension'],
      primary_condition: 'hypertension',
    })
    const ctx = makeCtx({
      patient,
      recent_vitals: [makeVital({ value_primary: 150 }), makeVital({ value_primary: 150 })],
    })
    // avg 150 → HN002 fires
    expect(evaluateBpRules(ctx, merged)).toHaveLength(1)
  })
})

describe('BP diastolic', () => {
  const rule = makeRule({
    id: 'DIA-1',
    condition: 'hypertension',
    metric: 'bp_diastolic',
    operator: 'gt',
    threshold: 90,
    window_days: 1,
    severity: 'high',
    data_source: 'check_in',
  })
  const merged = withRules([rule])

  it('fires above 90', () => {
    const patient = makePatient({
      conditions: ['hypertension'],
      primary_condition: 'hypertension',
    })
    const ctx = makeCtx({
      patient,
      recent_vitals: [makeVital({ value_primary: 150, value_secondary: 95 })],
    })
    expect(evaluateBpRules(ctx, merged)).toHaveLength(1)
  })

  it('null diastolic → no fire', () => {
    const patient = makePatient({
      conditions: ['hypertension'],
      primary_condition: 'hypertension',
    })
    const ctx = makeCtx({
      patient,
      recent_vitals: [makeVital({ value_primary: 150, value_secondary: null })],
    })
    expect(evaluateBpRules(ctx, merged)).toHaveLength(0)
  })
})

// ─── TSH / HbA1c / Lipid — lab_integration data source ─────────────────────

describe('Lab-based rules — data_source gating', () => {
  const tshRule = makeRule({
    id: 'HT002',
    condition: 'hypothyroid',
    metric: 'tsh',
    operator: 'gt',
    threshold: 4.5,
    window_days: 1,
    severity: 'high',
    notify_doctor: true,
    data_source: 'lab_integration',
  })
  const merged = withRules([tshRule])

  it('fires when TSH > 4.5', () => {
    const patient = makePatient({
      conditions: ['hypothyroid'],
      primary_condition: 'hypothyroid',
    })
    const ctx = makeCtx({
      patient,
      recent_labs: [makeLab({ tsh: 5.0 })],
    })
    expect(evaluateSymptomRules(ctx, merged)).toHaveLength(1)
  })

  it('does not fire at boundary 4.5', () => {
    const patient = makePatient({
      conditions: ['hypothyroid'],
      primary_condition: 'hypothyroid',
    })
    const ctx = makeCtx({
      patient,
      recent_labs: [makeLab({ tsh: 4.5 })],
    })
    expect(evaluateSymptomRules(ctx, merged)).toHaveLength(0)
  })

  it('skips when no labs — data source unavailable', () => {
    const patient = makePatient({
      conditions: ['hypothyroid'],
      primary_condition: 'hypothyroid',
    })
    const ctx = makeCtx({ patient, recent_labs: [] })
    expect(evaluateSymptomRules(ctx, merged)).toHaveLength(0)
  })

  it('skips when lab has null TSH value', () => {
    const patient = makePatient({
      conditions: ['hypothyroid'],
      primary_condition: 'hypothyroid',
    })
    const ctx = makeCtx({ patient, recent_labs: [makeLab({ tsh: null })] })
    expect(evaluateSymptomRules(ctx, merged)).toHaveLength(0)
  })
})

describe('HbA1c and lipid panel', () => {
  it('HbA1c < 5.7 fires reversal rule', () => {
    const rule = makeRule({
      id: 'DR008',
      metric: 'hba1c',
      operator: 'lt',
      threshold: 5.7,
      window_days: 1,
      severity: 'positive',
      notify_doctor: true,
      data_source: 'lab_integration',
    })
    const ctx = makeCtx({ recent_labs: [makeLab({ hba1c: 5.5 })] })
    expect(evaluateSymptomRules(ctx, withRules([rule]))).toHaveLength(1)
  })

  it('Triglycerides > 200 fires DL001', () => {
    const rule = makeRule({
      id: 'DL001',
      condition: 'dyslipidemia',
      metric: 'lipid_panel',
      operator: 'gt',
      threshold: 200,
      window_days: 1,
      severity: 'high',
      notify_doctor: true,
      data_source: 'lab_integration',
    })
    const patient = makePatient({
      conditions: ['dyslipidemia'],
      primary_condition: 'dyslipidemia',
    })
    const ctx = makeCtx({ patient, recent_labs: [makeLab({ triglycerides: 250 })] })
    expect(evaluateSymptomRules(ctx, withRules([rule]))).toHaveLength(1)
  })
})

// ─── Adherence band boundaries (20 / 40 / 60 / 80 / 100) ───────────────────

describe('Adherence rule boundaries', () => {
  const rule = makeRule({
    id: 'DR010',
    metric: 'adherence',
    operator: 'lt',
    threshold: 65,
    window_days: 7,
    severity: 'low',
    data_source: 'check_in',
  })
  const merged = withRules([rule])

  it('low adherence across window (weight 25) fires below 65', () => {
    const history = makeHistory(6, () => ({ adherence_yesterday: 'low' }))
    const ctx = makeCtx({
      check_in: makeCheckIn({ adherence_yesterday: 'low' }),
      recent_check_ins: history,
    })
    expect(evaluateAdherenceRules(ctx, merged)).toHaveLength(1)
  })

  it('high adherence (weight 80) does not fire', () => {
    const history = makeHistory(6, () => ({ adherence_yesterday: 'high' }))
    const ctx = makeCtx({
      check_in: makeCheckIn({ adherence_yesterday: 'high' }),
      recent_check_ins: history,
    })
    expect(evaluateAdherenceRules(ctx, merged)).toHaveLength(0)
  })

  it('no adherence data at all → no fire', () => {
    const ctx = makeCtx({
      check_in: makeCheckIn({ adherence_yesterday: null }),
      recent_check_ins: makeHistory(6, () => ({ adherence_yesterday: null })),
    })
    expect(evaluateAdherenceRules(ctx, merged)).toHaveLength(0)
  })
})

// ─── Cycle (aspirational — cycle_tracking data source) ─────────────────────

describe('Cycle rules — data source gating', () => {
  const rule = makeRule({
    id: 'PC010',
    condition: 'pcos',
    metric: 'cycle',
    operator: 'gt',
    threshold: 40,
    window_days: 1,
    severity: 'medium',
    notify_doctor: true,
    data_source: 'cycle_tracking',
  })
  const merged = withRules([rule])

  it('skips evaluation when no cycle history', () => {
    const patient = makePatient({ conditions: ['pcos'], primary_condition: 'pcos' })
    const ctx = makeCtx({ patient, recent_cycles: [] })
    expect(evaluateSpecialRules(ctx, merged)).toHaveLength(0)
  })

  it('fires when cycle days since start > 40', () => {
    const patient = makePatient({ conditions: ['pcos'], primary_condition: 'pcos' })
    const cycleStart = new Date(FIXED_NOW.getTime() - 45 * 86_400_000).toISOString().slice(0, 10)
    const ctx = makeCtx({
      patient,
      recent_cycles: [makeCycle({ cycle_start_date: cycleStart })],
    })
    expect(evaluateSpecialRules(ctx, merged)).toHaveLength(1)
  })
})

// ─── Data source / aspirational handling ───────────────────────────────────

describe('isDataSourceAvailable', () => {
  it('check_in is always available', () => {
    expect(isDataSourceAvailable(makeRule({ data_source: 'check_in' }), makeCtx())).toBe(true)
  })

  it('wearable is always unavailable in v1', () => {
    expect(isDataSourceAvailable(makeRule({ data_source: 'wearable' }), makeCtx())).toBe(false)
  })

  it('lab_integration requires at least one lab row', () => {
    expect(
      isDataSourceAvailable(
        makeRule({ data_source: 'lab_integration' }),
        makeCtx({ recent_labs: [] })
      )
    ).toBe(false)
    expect(
      isDataSourceAvailable(
        makeRule({ data_source: 'lab_integration' }),
        makeCtx({ recent_labs: [makeLab()] })
      )
    ).toBe(true)
  })

  it('cycle_tracking requires at least one cycle row', () => {
    expect(
      isDataSourceAvailable(
        makeRule({ data_source: 'cycle_tracking' }),
        makeCtx({ recent_cycles: [] })
      )
    ).toBe(false)
    expect(
      isDataSourceAvailable(
        makeRule({ data_source: 'cycle_tracking' }),
        makeCtx({ recent_cycles: [makeCycle()] })
      )
    ).toBe(true)
  })
})

// ─── Applicability filter ───────────────────────────────────────────────────

describe('ruleAppliesToPatient', () => {
  it('global rules apply to everyone', () => {
    expect(ruleAppliesToPatient(makeRule({ condition: 'global' }), makePatient())).toBe(true)
  })

  it('condition rules apply only when patient has the condition', () => {
    const rule = makeRule({ condition: 'pcos' })
    expect(
      ruleAppliesToPatient(
        rule,
        makePatient({ conditions: ['diabetes_t2'], primary_condition: 'diabetes_t2' })
      )
    ).toBe(false)
    expect(
      ruleAppliesToPatient(rule, makePatient({ conditions: ['pcos'], primary_condition: 'pcos' }))
    ).toBe(true)
  })
})

// ─── Template interpolation ─────────────────────────────────────────────────

describe('renderTemplate', () => {
  it('substitutes known placeholders', () => {
    expect(renderTemplate('FBS {fbs} mg/dL above target.', { fbs: 145 })).toBe(
      'FBS 145 mg/dL above target.'
    )
  })

  it('replaces null/undefined with em-dash placeholder', () => {
    expect(renderTemplate('energy {energy}', { energy: null })).toBe('energy —')
    expect(renderTemplate('energy {energy}', {})).toBe('energy —')
  })

  it('leaves unknown variables as em-dash too', () => {
    expect(renderTemplate('{missing}', {})).toBe('—')
  })
})

// ─── getMetricValue direct coverage for remaining paths ────────────────────

describe('getMetricValue edge paths', () => {
  it('post_meal_walks_missed returns null (not yet wired)', () => {
    const rule = makeRule({ metric: 'post_meal_walks_missed' })
    expect(getMetricValue(rule, makeCtx())).toBeNull()
  })

  it('medication_missed returns null (not yet wired)', () => {
    const rule = makeRule({ metric: 'medication_missed' })
    expect(getMetricValue(rule, makeCtx())).toBeNull()
  })
})

// ─── Unused rule-group wrappers (ensure they evaluate without error) ───────

describe('Rule-group wrapper smoke', () => {
  it('evaluatePostMealRules returns [] when the metric is not yet wired', () => {
    const rule = makeRule({ metric: 'post_meal_walks_missed' })
    expect(evaluatePostMealRules(makeCtx(), withRules([rule]))).toStrictEqual([])
  })

  it('evaluateRequestRules is a no-op stub today (no request metrics defined)', () => {
    expect(evaluateRequestRules(makeCtx(), withRules([makeRule()]))).toStrictEqual([])
  })

  it('evaluateRules end-to-end fires nothing when rule list is empty', () => {
    expect(evaluateRules(makeCtx(), withRules([]))).toStrictEqual([])
  })
})
