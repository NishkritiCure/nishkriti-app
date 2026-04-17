/**
 * Component-test setup.
 *
 * Loaded in addition to `setup.ts` for files under src/components/** and
 * src/screens/**. Provides the RN-side mocks (Reanimated mock bundle,
 * SVG stubs, AccessibilityInfo shim) that let RNTL render components
 * in a jsdom environment without touching the native bridge.
 */
import { vi } from 'vitest'

// Reanimated 4 ships its official mock as source (`./src/mock`) and needs
// the project's babel/metro toolchain to transform it. Vitest doesn't run
// that pipeline, so we inline a minimal mock that covers the APIs the
// Phase-C component library depends on (useSharedValue, useAnimatedStyle,
// with* timeline builders, cancelAnimation, Easing).
vi.mock('react-native-reanimated', async () => {
  const { View, Text, ScrollView } = await import('react-native')

  const identity = <T>(value: T): T => value
  const useSharedValue = <T>(initial: T) => ({ value: initial })
  const useAnimatedStyle = (factory: () => object) => {
    try {
      return factory()
    } catch {
      return {}
    }
  }
  const useDerivedValue = (factory: () => unknown) => ({ value: factory() })
  const withTiming = <T>(value: T) => value
  const withSpring = <T>(value: T) => value
  const withDelay = <T>(_d: number, value: T) => value
  const withSequence = <T>(...values: T[]) => values[values.length - 1]
  const withRepeat = <T>(value: T) => value
  const cancelAnimation = () => {
    /* no-op */
  }
  const runOnJS =
    <Args extends readonly unknown[], R>(fn: (...args: Args) => R) =>
    (...args: Args) =>
      fn(...args)
  const runOnUI = runOnJS
  const Easing = {
    linear: identity,
    ease: identity,
    bezier: () => identity,
    in: identity,
    out: identity,
    inOut: identity,
    circle: identity,
    quad: identity,
    cubic: identity,
  }

  return {
    default: { View, Text, ScrollView, createAnimatedComponent: identity },
    View,
    Text,
    ScrollView,
    createAnimatedComponent: identity,
    useSharedValue,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
    withSpring,
    withDelay,
    withSequence,
    withRepeat,
    cancelAnimation,
    runOnJS,
    runOnUI,
    Easing,
    // Layout animation presets referenced by MealCard etc. — return plain
    // objects; the native stage ignores these in tests.
    Layout: { springify: () => ({}) },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
  }
})

// react-native-svg in node needs a light-weight stub. We return an element
// factory per primitive so React can still construct a tree.
vi.mock('react-native-svg', async () => {
  const { createElement } = await import('react')
  const make =
    (name: string) =>
    // eslint-disable-next-line react/display-name
    (props: Record<string, unknown>) =>
      createElement(name, props)
  return {
    default: make('Svg'),
    Svg: make('Svg'),
    Path: make('Path'),
    Rect: make('Rect'),
    Circle: make('Circle'),
    Line: make('Line'),
    G: make('G'),
    Defs: make('Defs'),
    LinearGradient: make('LinearGradient'),
    RadialGradient: make('RadialGradient'),
    Stop: make('Stop'),
    Mask: make('Mask'),
    ClipPath: make('ClipPath'),
    Text: make('SvgText'),
    TextPath: make('TextPath'),
    Polygon: make('Polygon'),
    Polyline: make('Polyline'),
    Use: make('Use'),
    Symbol: make('Symbol'),
    ForeignObject: make('ForeignObject'),
    Pattern: make('Pattern'),
    Image: make('SvgImage'),
  }
})

// Keep AccessibilityInfo predictable across tests.
vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native')
  return {
    ...actual,
    AccessibilityInfo: {
      ...actual.AccessibilityInfo,
      isReduceMotionEnabled: vi.fn(async () => false),
      addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    },
  }
})
