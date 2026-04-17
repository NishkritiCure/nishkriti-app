/**
 * Border radii per APP-DESIGN-REFERENCE §5.1.
 *
 * `pill` is the "fully rounded" value for capsule shapes — any number big
 * enough to saturate a rounded-rect corner works; 999 is the Phase-1 value.
 */
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const

export type RadiusKey = keyof typeof radius
