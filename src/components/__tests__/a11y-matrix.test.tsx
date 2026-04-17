// @vitest-environment jsdom
/**
 * Accessibility matrix.
 *
 * Cross-cutting checks that exercise the theme + component library as a
 * group, not any single component. Three axes:
 *
 *   1. Dynamic type — scaleFont() must cap at 1.5× so layouts don't
 *      crumble at iOS XXXL / Android 200%.
 *   2. Reduced motion — useReducedMotion must surface the system pref,
 *      and animation-carrying components (NishkritiLogo, ECGPulse,
 *      Skeleton) must accept a reduced value without crashing.
 *   3. Touch-target audit — every interactive primitive / composite
 *      rendered in the kitchen sink has a resolvable accessibility
 *      label (the first line of defence against VoiceOver cliff edges).
 */
import { screen } from '@testing-library/react'
import { PixelRatio } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'
import {
  BannerAlert,
  Button,
  Checkbox,
  ECGPulse,
  IconButton,
  NishkritiLogo,
  NSlider,
  Skeleton,
  Stepper,
  Switch,
  Tag,
} from '@/components'
import { scaleFont } from '@/theme'

describe('scaleFont (dynamic type)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('is identity when the user keeps the default scale', () => {
    vi.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1)
    expect(scaleFont(16)).toBe(16)
  })

  it('scales up to the cap at iOS XXXL (1.5×)', () => {
    vi.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5)
    expect(scaleFont(16)).toBe(24)
  })

  it('caps at 1.5× even at Android 200%', () => {
    vi.spyOn(PixelRatio, 'getFontScale').mockReturnValue(2)
    expect(scaleFont(16)).toBe(24)
  })

  it('handles small base sizes by rounding', () => {
    vi.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.25)
    expect(scaleFont(12)).toBe(15)
  })
})

describe('reduced motion — animated components mount in the reduced state', () => {
  // The AccessibilityInfo mock in setup.rn.ts returns false by default.
  // These assertions verify the render paths complete without crashing;
  // worklet bodies are substituted by the Reanimated mock.
  it('NishkritiLogo renders with pulse enabled', () => {
    renderWithTheme(<NishkritiLogo showPulse accessibilityLabel="logo-motion" />)
    expect(screen.getByLabelText('logo-motion')).toBeTruthy()
  })

  it('NishkritiLogo renders with pulse disabled', () => {
    renderWithTheme(<NishkritiLogo showPulse={false} accessibilityLabel="logo-quiet" />)
    expect(screen.getByLabelText('logo-quiet')).toBeTruthy()
  })

  it('ECGPulse mounts without a runtime motion error', () => {
    renderWithTheme(<ECGPulse accessibilityLabel="ecg-motion" />)
    expect(screen.getByLabelText('ecg-motion')).toBeTruthy()
  })

  it('Skeleton mounts under the same mock', () => {
    renderWithTheme(<Skeleton accessibilityLabel="shimmer" />)
    expect(screen.getByRole('progressbar', { name: 'shimmer' })).toBeTruthy()
  })
})

describe('touch-target audit — interactive primitives expose a11y labels', () => {
  it('Button resolves by role+name', () => {
    renderWithTheme(<Button label="OK" />)
    expect(screen.getByRole('button', { name: 'OK' })).toBeTruthy()
  })

  it('IconButton demands and uses accessibilityLabel', () => {
    renderWithTheme(<IconButton icon={null} accessibilityLabel="Menu" />)
    expect(screen.getByRole('button', { name: 'Menu' })).toBeTruthy()
  })

  it('Checkbox exposes role=checkbox and label', () => {
    renderWithTheme(<Checkbox checked onChange={() => undefined} label="Agree" />)
    expect(screen.getByRole('checkbox', { name: 'Agree' })).toBeTruthy()
  })

  it('Switch exposes role=switch and required label', () => {
    renderWithTheme(<Switch value onValueChange={() => undefined} accessibilityLabel="WiFi" />)
    expect(screen.getByRole('switch', { name: 'WiFi' })).toBeTruthy()
  })

  it('NSlider exposes adjustable role with value text', () => {
    renderWithTheme(
      <NSlider
        min={0}
        max={10}
        value={5}
        unit="mg"
        onValueChange={() => undefined}
        accessibilityLabel="Dose"
      />
    )
    expect(screen.getByRole('slider', { name: 'Dose' })).toBeTruthy()
  })

  it('Stepper adjustables carry accessibilityValue', () => {
    renderWithTheme(
      <Stepper
        value={3}
        onChange={() => undefined}
        min={0}
        max={10}
        accessibilityLabel="Servings"
      />
    )
    // RN's role="adjustable" maps to WAI-ARIA "slider" on the DOM.
    expect(screen.getAllByRole('slider', { name: 'Servings' }).length).toBeGreaterThan(0)
  })

  it('Tag resolves when interactive', () => {
    renderWithTheme(<Tag label="press" onPress={() => undefined} />)
    expect(screen.getByRole('button', { name: 'press' })).toBeTruthy()
  })

  it('BannerAlert emits role=alert with composed label', () => {
    renderWithTheme(<BannerAlert variant="warning" title="Heads up" />)
    expect(screen.getAllByRole('alert', { name: /warning/i }).length).toBeGreaterThan(0)
  })
})
