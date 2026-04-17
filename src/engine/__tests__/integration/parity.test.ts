/**
 * Parity test harness — TS engine vs Python engine.
 *
 * Gated on the ENGINE_PARITY_ARTIFACT env var pointing at the fixture JSON
 * produced by backend CI. When unset, the suite skips with a single marker
 * test that exposes the unmet dependency. See fixtures/parity/README.md.
 */

import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

import { generate } from '@/engine/adaptiveEngine'

interface ParityFixture {
  name: string
  input: unknown // backend emits the same EngineInputs-shaped JSON the TS engine consumes
  expected_output: unknown
}

const ARTIFACT_PATH = process.env['ENGINE_PARITY_ARTIFACT']

describe('engine parity vs Python backend', () => {
  if (!ARTIFACT_PATH) {
    it.skip('parity fixture artifact not provided (set ENGINE_PARITY_ARTIFACT)', () => {
      // Intentionally left blank — the skip surfaces the missing dependency
      // in CI output without failing the build. The backend publishes the
      // artifact as part of its engine-test CI job; once that's live, set
      // ENGINE_PARITY_ARTIFACT in the app's CI workflow.
    })
    return
  }

  const raw = fs.readFileSync(ARTIFACT_PATH, 'utf8')
  const fixtures = JSON.parse(raw) as { fixtures: ParityFixture[] }

  for (const fx of fixtures.fixtures) {
    it(`parity: ${fx.name}`, () => {
      // Each fixture's `input` must match EngineInputs shape. The backend is
      // responsible for serialising dates as ISO strings; we re-hydrate below.
      const input = hydrateDates(fx.input) as Parameters<typeof generate>[0]
      const result = generate(input)
      expect(result).toStrictEqual(fx.expected_output)
    })
  }
})

function hydrateDates(input: unknown): unknown {
  if (input === null || input === undefined) return input
  if (typeof input === 'string' && isIsoDate(input)) return new Date(input)
  if (Array.isArray(input)) return input.map(hydrateDates)
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = k === 'now' && typeof v === 'string' ? new Date(v) : hydrateDates(v)
    }
    return out
  }
  return input
}

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)
}
