/**
 * Rule evaluator — reads MergedRules.content.rules (interpreted JSONB data)
 * and fires the rules whose operator+threshold matches the current metric.
 *
 * Aspirational rules whose data_source isn't yet available are skipped —
 * they activate automatically when the relevant data starts flowing.
 *
 * The engine does NO hardcoding of rule thresholds. Values live in
 * engine_base_versions.content_json (versioned by doctor approval). This
 * module is the interpreter.
 */

import type {
  DailyCheckIn,
  FiredRule,
  LabResult,
  MenstrualCycle,
  MergedRules,
  Patient,
  ProtocolRule,
  RuleEvaluationContext,
  RuleMetric,
  RuleOperator,
  Vital,
} from './types'

export function evaluateRules(ctx: RuleEvaluationContext, merged: MergedRules): FiredRule[] {
  const fired: FiredRule[] = []

  for (const rule of merged.content.rules) {
    if (!ruleAppliesToPatient(rule, ctx.patient)) continue
    if (!isDataSourceAvailable(rule, ctx)) continue

    const value = getMetricValue(rule, ctx)
    if (value === null) continue

    if (checkOperator(value, rule.operator, rule.threshold)) {
      fired.push({
        rule_id: rule.id,
        severity: rule.severity,
        notify_doctor: rule.notify_doctor,
        message: renderTemplate(rule.reasoning_template, {
          value,
          fbs: ctx.check_in.fbs_mg_dl ?? null,
          energy: ctx.check_in.energy_level ?? null,
          weight: ctx.check_in.weight_kg ?? null,
          condition: rule.condition,
        }),
        diet_actions: rule.diet_actions,
        workout_actions: rule.workout_actions,
      })
    }
  }

  return fired
}

export function ruleAppliesToPatient(rule: ProtocolRule, patient: Patient): boolean {
  if (rule.condition === 'global') return true
  return patient.conditions.includes(rule.condition)
}

/**
 * A rule is skipped when its required data source hasn't produced usable rows
 * for the metric it evaluates. Lets the same base version ship with forward-
 * compatible rules that silently activate as data flows in.
 */
export function isDataSourceAvailable(rule: ProtocolRule, ctx: RuleEvaluationContext): boolean {
  switch (rule.data_source) {
    case 'check_in':
      return true
    case 'lab_integration':
      return ctx.recent_labs.length > 0
    case 'wearable':
      return false
    case 'cycle_tracking':
      return ctx.recent_cycles.length > 0
  }
}

/**
 * Pull the numeric value this rule compares its threshold against, using the
 * configured window. Returns null when the data isn't present.
 */
export function getMetricValue(rule: ProtocolRule, ctx: RuleEvaluationContext): number | null {
  switch (rule.metric) {
    case 'fbs':
      return fbsValue(rule, ctx.check_in, ctx.recent_check_ins)
    case 'weight':
      return weightDelta(rule, ctx.check_in, ctx.recent_check_ins)
    case 'energy':
      return energyMin(rule, ctx.check_in, ctx.recent_check_ins)
    case 'sleep':
      return sleepMin(rule, ctx.check_in, ctx.recent_check_ins)
    case 'tsh':
      return ctx.recent_labs[0]?.tsh ?? null
    case 'hba1c':
      return ctx.recent_labs[0]?.hba1c ?? null
    case 'lipid_panel':
      return lipidFromLabs(ctx.recent_labs)
    case 'bp_systolic':
      return bpAvg(ctx.recent_vitals, rule.window_days, 'primary')
    case 'bp_diastolic':
      return bpAvg(ctx.recent_vitals, rule.window_days, 'secondary')
    case 'cycle':
      return cycleDaysSince(ctx.recent_cycles, ctx.now)
    case 'adherence':
      return adherenceCount(rule, ctx.check_in, ctx.recent_check_ins)
    case 'post_meal_walks_missed':
    case 'medication_missed':
      // Derived from adherence/workout logs — wired in later phase. Skip for now.
      return null
  }
}

function fbsValue(
  rule: ProtocolRule,
  today: DailyCheckIn,
  history: readonly DailyCheckIn[]
): number | null {
  if (rule.window_days <= 1) return today.fbs_mg_dl ?? null
  // Multi-day rule: needs window_days of data. Otherwise we can't prove the
  // "N consecutive days in band" semantics, so we skip — a new patient with
  // one reading shouldn't trigger a 3-day rule.
  const recent = [today, ...history].slice(0, rule.window_days)
  const values = recent.map((c) => c.fbs_mg_dl).filter((v): v is number => v !== null)
  if (values.length < rule.window_days) return null
  return Math.min(...values)
}

function weightDelta(
  rule: ProtocolRule,
  today: DailyCheckIn,
  history: readonly DailyCheckIn[]
): number | null {
  if (today.weight_kg === null) return null
  const past = history.find((h) => {
    const d = dateDiffDays(today.check_in_date, h.check_in_date)
    return d >= rule.window_days && h.weight_kg !== null
  })
  if (!past || past.weight_kg === null) return null
  // Round to 2dp — user input is 0.1 kg precision; rounding here avoids
  // floating-point noise polluting boundary comparisons (e.g. 70 − 70.3 →
  // −0.29999... which falsely fails a between [-1.0, -0.3] check).
  return Math.round((today.weight_kg - past.weight_kg) * 100) / 100
}

function energyMin(
  rule: ProtocolRule,
  today: DailyCheckIn,
  history: readonly DailyCheckIn[]
): number | null {
  const recent = [today, ...history].slice(0, rule.window_days)
  const values = recent.map((c) => c.energy_level).filter((v): v is number => v !== null)
  if (values.length < rule.window_days) return null
  return Math.min(...values)
}

function sleepMin(
  rule: ProtocolRule,
  today: DailyCheckIn,
  history: readonly DailyCheckIn[]
): number | null {
  const recent = [today, ...history].slice(0, rule.window_days)
  const values = recent.map((c) => c.sleep_hours).filter((v): v is number => v !== null)
  if (values.length < rule.window_days) return null
  return Math.min(...values)
}

function bpAvg(
  vitals: readonly Vital[],
  windowDays: number,
  field: 'primary' | 'secondary'
): number | null {
  const bp = vitals.filter((v) => v.metric_type === 'blood_pressure').slice(0, windowDays)
  if (bp.length === 0) return null
  const values = bp
    .map((v) => (field === 'primary' ? v.value_primary : v.value_secondary))
    .filter((x): x is number => typeof x === 'number')
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function cycleDaysSince(cycles: readonly MenstrualCycle[], now: Date): number | null {
  if (cycles.length === 0) return null
  const last = cycles[0]
  if (!last) return null
  return dateDiffDays(now.toISOString().slice(0, 10), last.cycle_start_date)
}

function lipidFromLabs(labs: readonly LabResult[]): number | null {
  // Rules referencing lipid_panel carry their own operator against a chosen
  // marker via threshold+reasoning_template — here we just expose the most
  // recent triglyceride reading as the default lipid metric. Specific LDL/HDL
  // rules can be authored using separate metrics in future. Phase-d reviewers:
  // revisit if a rule needs LDL vs HDL distinction before wiring labs.
  return labs[0]?.triglycerides ?? null
}

function adherenceCount(
  rule: ProtocolRule,
  today: DailyCheckIn,
  history: readonly DailyCheckIn[]
): number | null {
  const recent = [today, ...history].slice(0, rule.window_days)
  const levels = recent
    .map((c) => c.adherence_yesterday)
    .filter((v): v is NonNullable<typeof v> => v !== null)
  if (levels.length === 0) return null
  const weights = { low: 25, medium: 50, high: 80, perfect: 100 }
  const avg = levels.reduce((a, b) => a + weights[b], 0) / levels.length
  return Math.round(avg)
}

export function checkOperator(
  value: number,
  op: RuleOperator,
  threshold: number | readonly [number, number]
): boolean {
  switch (op) {
    case 'gt':
      return value > (threshold as number)
    case 'gte':
      return value >= (threshold as number)
    case 'lt':
      return value < (threshold as number)
    case 'lte':
      return value <= (threshold as number)
    case 'eq':
      return value === (threshold as number)
    case 'between': {
      const [lo, hi] = threshold as readonly [number, number]
      return value >= lo && value <= hi
    }
  }
}

/** Simple Handlebars-style placeholder interpolation. Locale-free. */
export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key]
    return v === null || v === undefined ? '—' : String(v)
  })
}

function dateDiffDays(a: string, b: string): number {
  const aMs = Date.parse(a + 'T00:00:00Z')
  const bMs = Date.parse(b + 'T00:00:00Z')
  return Math.round((aMs - bMs) / 86_400_000)
}

// ─── Rule-group sub-exports (metric-bucketed) ───────────────────────────────
// The boundary test files in TESTING-STRATEGY §3.1 are organised by metric.
// These thin wrappers let each test exercise only rules of the relevant kind.

type MetricGroup = {
  fbs: RuleMetric[]
  postMeal: RuleMetric[]
  bp: RuleMetric[]
  weight: RuleMetric[]
  symptoms: RuleMetric[]
  adherence: RuleMetric[]
  energy: RuleMetric[]
  request: RuleMetric[]
  special: RuleMetric[]
}

const METRIC_GROUPS: MetricGroup = {
  fbs: ['fbs'],
  postMeal: ['post_meal_walks_missed'],
  bp: ['bp_systolic', 'bp_diastolic'],
  weight: ['weight'],
  symptoms: ['tsh', 'lipid_panel', 'hba1c'],
  adherence: ['adherence', 'medication_missed'],
  energy: ['energy', 'sleep'],
  request: [],
  special: ['cycle'],
}

function evaluateByGroup(
  group: keyof MetricGroup,
  ctx: RuleEvaluationContext,
  merged: MergedRules
): FiredRule[] {
  const metrics = new Set(METRIC_GROUPS[group])
  const scoped: MergedRules = {
    ...merged,
    content: {
      ...merged.content,
      rules: merged.content.rules.filter((r) => metrics.has(r.metric)),
    },
  }
  return evaluateRules(ctx, scoped)
}

export const evaluateFbsRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('fbs', ctx, merged)
export const evaluatePostMealRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('postMeal', ctx, merged)
export const evaluateBpRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('bp', ctx, merged)
export const evaluateWeightRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('weight', ctx, merged)
export const evaluateSymptomRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('symptoms', ctx, merged)
export const evaluateAdherenceRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('adherence', ctx, merged)
export const evaluateEnergyRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('energy', ctx, merged)
export const evaluateRequestRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('request', ctx, merged)
export const evaluateSpecialRules = (ctx: RuleEvaluationContext, merged: MergedRules) =>
  evaluateByGroup('special', ctx, merged)
