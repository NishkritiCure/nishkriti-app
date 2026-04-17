/**
 * Brand-asset constants.
 *
 * These colours are not theme-reactive: the Nishkriti mark is the same in
 * light and dark mode — it is the company's signature. They live alongside
 * the rest of the theme so the "hex-literals only in src/theme" invariant
 * holds everywhere else in the codebase.
 *
 * Authoritative source: `APP-DESIGN-REFERENCE.md` §2.1–§2.5.
 */

/** 4-stop gradient used on the logo's "N" body (id `mg`). */
export const LOGO_GRADIENT = [
  { offset: '0%', stopColor: '#B0F5DC' },
  { offset: '30%', stopColor: '#3EDBA5' },
  { offset: '70%', stopColor: '#22B88A' },
  { offset: '100%', stopColor: '#1B6B54' },
] as const

/** Shine-bar gradient across the top of the mark (id `bg` in source SVG). */
export const LOGO_SHINE_GRADIENT = [
  { offset: '0%', stopColor: '#B0F5DC', stopOpacity: '0.3' },
  { offset: '50%', stopColor: '#5AEDB5', stopOpacity: '1' },
  { offset: '100%', stopColor: '#B0F5DC', stopOpacity: '0.3' },
] as const

/** The exact "N" bezier path; coordinates MUST NOT be edited — contract. */
export const LOGO_N_PATH =
  'M12,28Q12,20 20,20L36,20Q44,20 44,28L44,122L136,20Q136,20 144,20L160,20Q168,20 168,28L168,200Q168,208 160,208L144,208Q136,208 136,200L136,106L44,208Q44,208 36,208L20,208Q12,208 12,200Z'

/** Decorative inline ECG line drawn within the logo (y:114 fixed). */
export const LOGO_INLINE_ECG_PATH =
  'M46,114L68,114L76,112L78,116L80,114L84,106L87,124L90,100L93,128L96,106L98,114L106,114L134,114'

/** Logo aspect ratio derived from the canonical 180×214 viewBox. */
export const LOGO_ASPECT_RATIO = 214 / 180
export const LOGO_VIEWBOX = '0 0 180 214'
