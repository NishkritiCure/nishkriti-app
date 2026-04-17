/**
 * 4-point spacing grid per EB-C §4.1.
 *
 * Identity-keyed so consumers read as `theme.spacing[16]` — the token IS its
 * value, and the keyset enforces picking from the grid rather than inventing
 * arbitrary pixels.
 */
export const spacing = {
  0: 0,
  2: 2,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
} as const

export type SpacingKey = keyof typeof spacing
