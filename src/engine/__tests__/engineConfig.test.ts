import { describe, expect, it } from 'vitest'

import { mergeEngineLayers } from '@/engine/engineConfig'
import { EngineError } from '@/services/errorService'

import {
  DIABETES_OVERLAY_ID,
  OVERRIDE_ID,
  PCOS_OVERLAY_ID,
  makeActiveLayers,
  makeBase,
  makeOverlay,
  makeOverride,
  makeRule,
} from './helpers/makeLayers'

describe('mergeEngineLayers', () => {
  it('returns base content unchanged when there are no overlays or override', () => {
    const base = makeBase()
    const layers = makeActiveLayers({ condition_overlay_version_ids: [] })

    const merged = mergeEngineLayers(base, [], null, layers, 'diabetes_t2')

    expect(merged.content).toStrictEqual(base.content_json)
    expect(merged.version_snapshot).toStrictEqual({
      base_version_id: base.id,
      condition_overlay_version_ids: [],
      override_version_id: null,
    })
  })

  it('throws ENGINE_NO_BASE_VERSION when base content is missing', () => {
    const layers = makeActiveLayers()
    expect(() =>
      mergeEngineLayers(
        null as unknown as Parameters<typeof mergeEngineLayers>[0],
        [],
        null,
        layers,
        'diabetes_t2'
      )
    ).toThrow(EngineError)
  })

  it('primary-condition overlay wins when two overlays disagree on carb_adjustments', () => {
    const base = makeBase()
    const diabetes = makeOverlay(
      'diabetes_t2',
      { carb_adjustments: { ...base.content_json.carb_adjustments, CRITICAL_FLOOR_G: 35 } },
      DIABETES_OVERLAY_ID
    )
    const pcos = makeOverlay(
      'pcos',
      { carb_adjustments: { ...base.content_json.carb_adjustments, CRITICAL_FLOOR_G: 40 } },
      PCOS_OVERLAY_ID
    )
    const layers = makeActiveLayers({
      condition_overlay_version_ids: [PCOS_OVERLAY_ID, DIABETES_OVERLAY_ID],
    })

    const merged = mergeEngineLayers(base, [diabetes, pcos], null, layers, 'diabetes_t2')

    expect(merged.content.carb_adjustments.CRITICAL_FLOOR_G).toBe(35)
  })

  it('patient override wins over everything', () => {
    const base = makeBase()
    const diabetes = makeOverlay('diabetes_t2', {
      carb_adjustments: { ...base.content_json.carb_adjustments, CRITICAL_FLOOR_G: 35 },
    })
    const override = makeOverride({
      carb_adjustments: { ...base.content_json.carb_adjustments, CRITICAL_FLOOR_G: 50 },
    })
    const layers = makeActiveLayers({ override_version_id: OVERRIDE_ID })

    const merged = mergeEngineLayers(base, [diabetes], override, layers, 'diabetes_t2')

    expect(merged.content.carb_adjustments.CRITICAL_FLOOR_G).toBe(50)
    expect(merged.version_snapshot.override_version_id).toBe(OVERRIDE_ID)
  })

  it('unions rules by id: later layer replaces same-id rule, new ids append', () => {
    const base = makeBase({
      rules: [
        makeRule({ id: 'DR001', severity: 'low' }),
        makeRule({ id: 'DR002', severity: 'high' }),
      ],
    })
    const overlay = makeOverlay('diabetes_t2', {
      rules: [
        makeRule({ id: 'DR002', severity: 'critical' }), // replaces
        makeRule({ id: 'DR099', severity: 'medium' }), // appends
      ],
    })
    const layers = makeActiveLayers()

    const merged = mergeEngineLayers(base, [overlay], null, layers, 'diabetes_t2')

    const ids = merged.content.rules.map((r) => r.id)
    expect(ids).toStrictEqual(['DR001', 'DR002', 'DR099'])
    expect(merged.content.rules.find((r) => r.id === 'DR002')?.severity).toBe('critical')
  })

  it('preserves version_snapshot from the active layers pointer row', () => {
    const base = makeBase()
    const layers = makeActiveLayers({
      base_version_id: base.id,
      condition_overlay_version_ids: [DIABETES_OVERLAY_ID, PCOS_OVERLAY_ID],
      override_version_id: OVERRIDE_ID,
    })

    const merged = mergeEngineLayers(base, [], null, layers, 'diabetes_t2')

    expect(merged.version_snapshot).toStrictEqual({
      base_version_id: base.id,
      condition_overlay_version_ids: [DIABETES_OVERLAY_ID, PCOS_OVERLAY_ID],
      override_version_id: OVERRIDE_ID,
    })
  })

  it('deep-merges post_meal_walks.durations_min so partial overlay patches do not erase siblings', () => {
    const base = makeBase()
    const overlay = makeOverlay('diabetes_t2', {
      post_meal_walks: {
        fbs_elevated_threshold: 130,
        fbs_high_threshold: 180,
        durations_min: { after_lunch: 25, after_dinner: 20 },
      },
    })
    const layers = makeActiveLayers()

    const merged = mergeEngineLayers(base, [overlay], null, layers, 'diabetes_t2')

    expect(merged.content.post_meal_walks.durations_min).toStrictEqual({
      after_lunch: 25,
      after_dinner: 20,
    })
  })

  it('leaves non-patched non-rule fields from base untouched', () => {
    const base = makeBase()
    const overlay = makeOverlay('diabetes_t2', {
      rules: [makeRule({ id: 'DR999' })],
    })
    const layers = makeActiveLayers()

    const merged = mergeEngineLayers(base, [overlay], null, layers, 'diabetes_t2')

    expect(merged.content.water).toStrictEqual(base.content_json.water)
    expect(merged.content.macro_splits).toStrictEqual(base.content_json.macro_splits)
    expect(merged.content.carb_adjustments).toStrictEqual(base.content_json.carb_adjustments)
  })
})
