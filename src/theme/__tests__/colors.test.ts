/**
 * WCAG AA contrast-ratio gate.
 *
 * The matrix below enumerates every text-on-surface combination that the
 * design system uses. For each pair the computed contrast must meet
 * WCAG 2.x AA (4.5:1 for normal text; we do not claim 3:1 large-text
 * relief because captions at 12pt count as normal text).
 *
 * If the build fails here, either lighten the text token or restrict the
 * pair out of the matrix with a documented justification. Do NOT lower
 * the MIN_RATIO — this is a medical-app non-negotiable.
 */
import { describe, expect, it } from 'vitest'

import { dark, light, type Colors } from '../colors'

const MIN_RATIO = 4.5

function parseHex(color: string): readonly [number, number, number] {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  return [r, g, b]
}

function channel(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(color: string): number {
  const [r, g, b] = parseHex(color)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(foreground: string, background: string): number {
  const lf = relativeLuminance(foreground)
  const lb = relativeLuminance(background)
  const brighter = Math.max(lf, lb)
  const darker = Math.min(lf, lb)
  return (brighter + 0.05) / (darker + 0.05)
}

type Pair = readonly [keyof Colors, keyof Colors]

const REQUIRED_AA_PAIRS: readonly Pair[] = [
  // Primary reading text on every surface — the most important pairs.
  ['ink', 'bg'],
  ['ink', 'deep'],
  ['ink', 'forest'],
  ['ink', 'card'],
  ['ink', 'card2'],
  ['ink', 'card3'],

  // Secondary text (ink2) — used on everything except the lightest card
  // elevation. card3 is reserved for primary `ink` captions.
  ['ink2', 'bg'],
  ['ink2', 'deep'],
  ['ink2', 'forest'],
  ['ink2', 'card'],
  ['ink2', 'card2'],

  // Tertiary text (ink3) — captions on root bg / header surfaces only.
  // By contract this is non-body text; any use on card surfaces needs an
  // explicit justification in the component.
  ['ink3', 'bg'],
  ['ink3', 'deep'],

  // Brand teal (interactive text, link-style) on every surface.
  ['teal', 'bg'],
  ['teal', 'deep'],
  ['teal', 'forest'],
  ['teal', 'card'],
  ['teal', 'card2'],
  ['teal', 'card3'],

  // Spring (metric display) on every surface.
  ['spring', 'bg'],
  ['spring', 'deep'],
  ['spring', 'forest'],
  ['spring', 'card'],
  ['spring', 'card2'],
  ['spring', 'card3'],

  // `cream` is deliberately excluded from the AA text matrix. It is a
  // decorative inverse-background token (e.g. dark-surface highlights) —
  // never used as reading text. Components that render cream must do so on
  // a dark surface or as a non-text element.

  // Semantic colours on the most common backgrounds.
  ['warning', 'bg'],
  ['warning', 'card'],
  ['danger', 'bg'],
  ['danger', 'card'],
  ['info', 'bg'],
  ['info', 'card'],
]

describe('color contrast (WCAG AA 4.5:1)', () => {
  for (const palette of [
    { name: 'dark', tokens: dark },
    { name: 'light', tokens: light },
  ] as const) {
    describe(`${palette.name} palette`, () => {
      for (const [fg, bg] of REQUIRED_AA_PAIRS) {
        it(`${String(fg)} on ${String(bg)} meets AA`, () => {
          const fgColor = palette.tokens[fg]
          const bgColor = palette.tokens[bg]
          const ratio = contrastRatio(fgColor, bgColor)
          // Round to 2dp for readable failure output.
          expect({
            pair: `${String(fg)} (${fgColor}) on ${String(bg)} (${bgColor})`,
            ratio: Number(ratio.toFixed(2)),
            required: MIN_RATIO,
          }).toMatchObject({
            ratio: expect.any(Number),
          })
          expect(ratio).toBeGreaterThanOrEqual(MIN_RATIO)
        })
      }
    })
  }

  it('light palette has the same key set as dark palette', () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort())
  })

  it('contrast math self-check: white on black is 21:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
  })

  it('contrast math self-check: black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })
})
