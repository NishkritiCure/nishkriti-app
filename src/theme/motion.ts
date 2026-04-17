/**
 * Motion tokens per EB-C §4.1.
 *
 * Durations are in milliseconds. Easings are stored as cubic-bezier tuples so
 * both RN core `Easing.bezier(...)` and Reanimated `Easing.bezier(...)` can
 * consume them without the module being imported at theme-load time (which
 * would otherwise drag a UI-thread dependency into the theme graph).
 */

export const motion = {
  duration: {
    fast: 150,
    med: 250,
    slow: 400,
    splash: 900,
    ecgCycle: 2800,
  },
  easing: {
    // Material "standard" curve — balanced accelerate/decelerate.
    standard: [0.4, 0.0, 0.2, 1] as const,
    // Accelerate — for elements leaving the screen.
    accelerate: [0.4, 0.0, 1.0, 1] as const,
    // Decelerate — for elements entering the screen.
    decelerate: [0.0, 0.0, 0.2, 1] as const,
    // Expo-out cubic — used by the splash sequence and logo pulse.
    outExpo: [0.16, 1, 0.3, 1] as const,
  },
} as const

export type DurationKey = keyof typeof motion.duration
export type EasingKey = keyof typeof motion.easing
