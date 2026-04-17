/**
 * Nishkriti typography scale.
 *
 * Named styles per APP-DESIGN-REFERENCE §4. Fonts are Lora (display + headings,
 * italic for character), DM Sans (body), DM Mono (labels + code), loaded from
 * @expo-google-fonts/* at runtime. The family strings below match the named
 * exports from those packages — if you change a weight, update the loader.
 *
 * Dynamic type: `scaleFont(size)` multiplies the base size by
 * `PixelRatio.getFontScale()` capped at 1.5× to keep layouts survivable at
 * iOS XXXL / Android 200%. Components should wrap their font-size reads in
 * scaleFont(...) when rendering user-readable text.
 */

import { PixelRatio } from 'react-native'

export const FONT_FAMILIES = {
  loraItalic: 'Lora_400Regular_Italic',
  loraMedium: 'Lora_500Medium',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemibold: 'DMSans_600SemiBold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
  devanagari: 'NotoSerifDevanagari_700Bold',
} as const

export type FontFamily = (typeof FONT_FAMILIES)[keyof typeof FONT_FAMILIES]

export interface TypographyStyle {
  readonly fontFamily: FontFamily
  readonly fontSize: number
  readonly lineHeight: number
  readonly fontWeight: '400' | '500' | '600' | '700'
  readonly letterSpacing: number
}

const MAX_FONT_SCALE = 1.5

/**
 * Applies the user's system font scale preference, capped at 1.5×.
 * Components consume this to honour dynamic type without letting
 * 200% scaling break grid layout.
 */
export function scaleFont(size: number): number {
  const scale = PixelRatio.getFontScale()
  return Math.round(size * Math.min(scale, MAX_FONT_SCALE))
}

const style = (
  fontFamily: FontFamily,
  fontSize: number,
  lineHeight: number,
  fontWeight: TypographyStyle['fontWeight'],
  letterSpacing = 0
): TypographyStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
})

export const typography = {
  // Display — hero / marketing
  displayL: style(FONT_FAMILIES.loraItalic, 44, 50, '400'),
  displayM: style(FONT_FAMILIES.loraItalic, 38, 46, '400'),
  displayS: style(FONT_FAMILIES.loraItalic, 32, 40, '400'),

  // Headings
  h1: style(FONT_FAMILIES.loraItalic, 30, 38, '400'),
  h2: style(FONT_FAMILIES.loraItalic, 24, 32, '400'),
  h3: style(FONT_FAMILIES.loraMedium, 20, 28, '500'),
  h4: style(FONT_FAMILIES.sansSemibold, 18, 26, '600'),

  // Body
  bodyL: style(FONT_FAMILIES.sans, 18, 28, '400'),
  bodyM: style(FONT_FAMILIES.sans, 16, 26, '400'),
  bodyS: style(FONT_FAMILIES.sans, 14, 22, '400'),

  // Labels (DM Mono, uppercase in use-site)
  labelL: style(FONT_FAMILIES.mono, 14, 20, '400', 2),
  labelM: style(FONT_FAMILIES.mono, 12, 18, '400', 2.5),
  labelS: style(FONT_FAMILIES.mono, 10, 14, '400', 2),

  // Misc
  caption: style(FONT_FAMILIES.sans, 12, 18, '400'),
  overline: style(FONT_FAMILIES.mono, 11, 16, '400', 3),
  code: style(FONT_FAMILIES.monoMedium, 14, 22, '500'),
} as const

export type TypographyKey = keyof typeof typography
