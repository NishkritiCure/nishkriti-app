/**
 * Layer merger for the fallback engine.
 *
 * Per APP-ENGINE-CONTEXT.md §3.6, the effective engine content is:
 *   base → overlays (by primary_condition priority) → patient_override
 * with "last write wins" semantics AND rule-list union.
 *
 * The merger MUST also preserve the source version IDs so adaptiveEngine
 * can emit engine_version_snapshot alongside the plan — this is what lets
 * phase-d POST the full fallback-submit body without a second round-trip.
 */

import { EngineError } from '@/services/errorService'
import type {
  ConditionType,
  EngineActiveLayers,
  EngineBaseVersion,
  EngineConditionOverlay,
  EngineLayerContent,
  EngineOverlayContent,
  MergedRules,
  PatientEngineOverride,
  ProtocolRule,
} from './types'

/**
 * Merge engine layers into the effective content the rule evaluator and
 * selectors will read.
 *
 * @param base       — global base version (one active row).
 * @param overlays   — per-condition overlays the patient is subject to.
 * @param override   — optional patient-level override.
 * @param layers     — pointer row naming which versions applied (used to
 *                     populate version_snapshot, independent of the objects
 *                     actually passed in).
 * @param primaryCondition — the patient's primary condition; breaks ties
 *                           when two overlays disagree on the same field.
 */
export function mergeEngineLayers(
  base: EngineBaseVersion,
  overlays: readonly EngineConditionOverlay[],
  override: PatientEngineOverride | null,
  layers: EngineActiveLayers,
  primaryCondition: ConditionType
): MergedRules {
  if (!base || !base.content_json) {
    throw new EngineError('Missing base engine version', 'ENGINE_NO_BASE_VERSION')
  }

  // Order overlays so the primary-condition overlay applies LAST among overlays.
  // Secondary overlays apply first. That makes primary-condition win on any
  // field collision per APP-ENGINE-CONTEXT.md §3.6.
  const priority = (c: typeof primaryCondition): number => (c === primaryCondition ? 1 : 0)
  const orderedOverlays = [...overlays].sort(
    (a, b) => priority(a.condition) - priority(b.condition)
  )

  let content: EngineLayerContent = base.content_json

  for (const overlay of orderedOverlays) {
    content = applyOverlay(content, overlay.content_json)
  }

  if (override) {
    content = applyOverlay(content, override.content_json)
  }

  return {
    content,
    version_snapshot: {
      base_version_id: layers.base_version_id,
      condition_overlay_version_ids: layers.condition_overlay_version_ids,
      override_version_id: layers.override_version_id,
    },
  }
}

/**
 * Apply one overlay's partial content on top of an accumulated EngineLayerContent.
 *
 * Non-rule fields use last-write-wins.
 * Rules are unioned by id: a later layer's rule with the same id REPLACES
 * the earlier one; rules with new ids are appended.
 */
function applyOverlay(base: EngineLayerContent, patch: EngineOverlayContent): EngineLayerContent {
  const mergedRules = mergeRules(base.rules, patch.rules)

  return {
    meal_slots: patch.meal_slots ?? base.meal_slots,
    macro_defaults: patch.macro_defaults
      ? { ...base.macro_defaults, ...patch.macro_defaults }
      : base.macro_defaults,
    biomarker_defaults: patch.biomarker_defaults
      ? { ...base.biomarker_defaults, ...patch.biomarker_defaults }
      : base.biomarker_defaults,
    rules: mergedRules,
    carb_adjustments: patch.carb_adjustments
      ? { ...base.carb_adjustments, ...patch.carb_adjustments }
      : base.carb_adjustments,
    macro_splits: patch.macro_splits
      ? { ...base.macro_splits, ...patch.macro_splits }
      : base.macro_splits,
    water: patch.water ? { ...base.water, ...patch.water } : base.water,
    // post_meal_walks patches wholesale — sub-fields are small and mandatory.
    post_meal_walks: patch.post_meal_walks ?? base.post_meal_walks,
  }
}

function mergeRules(
  baseRules: readonly ProtocolRule[],
  patchRules: readonly ProtocolRule[] | undefined
): readonly ProtocolRule[] {
  if (!patchRules || patchRules.length === 0) return baseRules

  const byId = new Map<string, ProtocolRule>()
  for (const rule of baseRules) byId.set(rule.id, rule)
  for (const rule of patchRules) byId.set(rule.id, rule)
  return Array.from(byId.values())
}
