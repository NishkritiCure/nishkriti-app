/**
 * Nishkriti color tokens.
 *
 * Flat Phase-1 token set derived from APP-DESIGN-REFERENCE §3.1 (dark) and
 * §3.2 (light). Keys are identical across both palettes — the dark palette
 * is the source of the `Colors` type; light must structurally match.
 *
 * Contract: the `ink2`/`ink3` pairs flagged in APP-DESIGN-REFERENCE §10.2 have
 * been nudged toward WCAG AA where the original Phase-1 values failed on the
 * darker surfaces. The exact accepted pairs are enforced by the contrast-ratio
 * test in `__tests__/colors.test.ts`.
 *
 * Components must consume palette via `useTheme()`. Raw string access is only
 * available through the `Tokens` export, intended for libraries (Victory
 * Native, Skia) that accept plain color strings.
 */

export const dark = {
  // Backgrounds
  bg: '#070F0C',
  deep: '#0D1F1A',
  forest: '#0F2318',
  card: '#172820',
  card2: '#1D3530',
  card3: '#223C36',

  // Brand accents
  teal: '#3EDBA5',
  em: '#1B6B54',
  spring: '#A8F5D5',
  cream: '#F5F0E8',

  // Semantic
  success: '#3EDBA5',
  warning: '#E8B84B',
  danger: '#D97B72',
  // info/blue brightened from Phase-1 #4A90B8 to pass AA on card surfaces.
  info: '#569BC0',
  rose: '#D97B72',
  amber: '#E8B84B',
  blue: '#569BC0',

  // Text (see APP-DESIGN-REFERENCE §10.2 — ink3 lightened from #3D5C4E to
  // pass AA 4.5:1 on bg/deep/forest. Use on card surfaces is gated by the
  // contrast matrix in colors.test.ts.)
  ink: '#DDE8E2',
  ink2: '#8AAA98',
  ink3: '#7A9989',

  // Borders
  border: 'rgba(62,219,165,0.09)',
  border2: 'rgba(62,219,165,0.18)',
  border3: 'rgba(62,219,165,0.30)',
  borderRose: 'rgba(217,123,114,0.22)',
  borderAmber: 'rgba(232,184,75,0.22)',

  // Glows
  glowTeal: 'rgba(62,219,165,0.08)',
  glowRose: 'rgba(217,123,114,0.08)',
  glowAmber: 'rgba(232,184,75,0.06)',
  heroGlow: 'rgba(27,107,84,0.18)',
  heroGlowLight: 'rgba(27,107,84,0.12)',
  heroGlowBlue: 'rgba(74,144,184,0.08)',

  // Semantic scales — background fills
  tealBgSubtle: 'rgba(62,219,165,0.06)',
  tealBgMedium: 'rgba(62,219,165,0.08)',
  tealBgStrong: 'rgba(62,219,165,0.10)',
  tealBorder: 'rgba(62,219,165,0.22)',

  roseBgSubtle: 'rgba(217,123,114,0.06)',
  roseBgMedium: 'rgba(217,123,114,0.08)',
  roseBgStrong: 'rgba(217,123,114,0.10)',
  roseBorder: 'rgba(217,123,114,0.22)',

  amberBgSubtle: 'rgba(232,184,75,0.06)',
  amberBgMedium: 'rgba(232,184,75,0.08)',
  amberBgStrong: 'rgba(232,184,75,0.10)',
  amberBorder: 'rgba(232,184,75,0.22)',

  blueBgSubtle: 'rgba(74,144,184,0.10)',
  blueBgMedium: 'rgba(74,144,184,0.12)',
  blueBgStrong: 'rgba(74,144,184,0.15)',
  blueBorder: 'rgba(74,144,184,0.22)',

  // Overlays / special
  whiteSubtle: 'rgba(255,255,255,0.04)',
  whiteOverlay: 'rgba(255,255,255,0.07)',
  whiteOverlayMed: 'rgba(255,255,255,0.12)',
  modalBackdrop: 'rgba(0,0,0,0.6)',
  shadowColor: '#000000',

  // Focus ring — not in Phase 1, required for a11y. Visible on dark bg.
  focusRing: '#6ED6A8',
} as const

// Loose signature: each token is a `string` (not its dark-palette literal).
// The light palette provides the same key set with its own values; key parity
// is enforced by a unit test in __tests__/colors.test.ts.
export type Colors = { readonly [K in keyof typeof dark]: string }

export const light: Colors = {
  // Backgrounds
  bg: '#F8F9FA',
  deep: '#FFFFFF',
  forest: '#F0F5F3',
  card: '#FFFFFF',
  card2: '#F5F7F6',
  card3: '#EDF1EF',

  // Brand accents — darker values used in light mode for AA text legibility
  // over white surfaces (verified in colors.test.ts).
  teal: '#057547',
  em: '#E8F5EE',
  spring: '#0A7B55',
  cream: '#F5F0E8',

  // Semantic — chosen to pass AA 4.5:1 on light bg/card surfaces.
  success: '#057547',
  warning: '#8A5500',
  danger: '#B8392E',
  info: '#1F5A9A',
  rose: '#B8392E',
  amber: '#8A5500',
  blue: '#1F5A9A',

  // Text — ink3 darkened from Phase-1 #A0AEC0 to pass AA on bg/deep.
  ink: '#1A202C',
  ink2: '#4A5568',
  ink3: '#61697B',

  // Borders
  border: '#E2E8F0',
  border2: '#CBD5E0',
  border3: '#0D9668',
  borderRose: 'rgba(184,57,46,0.25)',
  borderAmber: 'rgba(179,111,0,0.25)',

  // Glows — subtle in light mode
  glowTeal: 'rgba(13,150,104,0.06)',
  glowRose: 'rgba(184,57,46,0.06)',
  glowAmber: 'rgba(179,111,0,0.06)',
  heroGlow: 'rgba(13,150,104,0.10)',
  heroGlowLight: 'rgba(13,150,104,0.06)',
  heroGlowBlue: 'rgba(31,90,154,0.06)',

  // Semantic scales
  tealBgSubtle: 'rgba(13,150,104,0.06)',
  tealBgMedium: 'rgba(13,150,104,0.10)',
  tealBgStrong: 'rgba(13,150,104,0.14)',
  tealBorder: 'rgba(13,150,104,0.28)',

  roseBgSubtle: 'rgba(184,57,46,0.06)',
  roseBgMedium: 'rgba(184,57,46,0.10)',
  roseBgStrong: 'rgba(184,57,46,0.14)',
  roseBorder: 'rgba(184,57,46,0.28)',

  amberBgSubtle: 'rgba(179,111,0,0.06)',
  amberBgMedium: 'rgba(179,111,0,0.10)',
  amberBgStrong: 'rgba(179,111,0,0.14)',
  amberBorder: 'rgba(179,111,0,0.28)',

  blueBgSubtle: 'rgba(31,90,154,0.06)',
  blueBgMedium: 'rgba(31,90,154,0.10)',
  blueBgStrong: 'rgba(31,90,154,0.14)',
  blueBorder: 'rgba(31,90,154,0.28)',

  // Overlays
  whiteSubtle: 'rgba(0,0,0,0.02)',
  whiteOverlay: 'rgba(0,0,0,0.04)',
  whiteOverlayMed: 'rgba(0,0,0,0.08)',
  modalBackdrop: 'rgba(0,0,0,0.4)',
  shadowColor: '#000000',

  focusRing: '#0D9668',
}

/**
 * Raw token export for non-component consumers (Victory Native, Skia,
 * native module configs). Components should always go through `useTheme()`
 * to stay reactive to theme changes.
 */
export const Tokens = { dark, light } as const
