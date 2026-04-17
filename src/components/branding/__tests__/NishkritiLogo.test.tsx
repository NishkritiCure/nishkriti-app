// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { NishkritiLogo } from '../NishkritiLogo'

describe('NishkritiLogo', () => {
  it('renders without crashing at the default size', () => {
    renderWithTheme(<NishkritiLogo />)
    expect(screen.getByLabelText('Nishkriti logo')).toBeTruthy()
  })

  it('accepts named sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const
    for (const size of sizes) {
      const { unmount } = renderWithTheme(
        <NishkritiLogo size={size} accessibilityLabel={`logo-${size}`} />
      )
      expect(screen.getByLabelText(`logo-${size}`)).toBeTruthy()
      unmount()
    }
  })

  it('accepts a numeric size override', () => {
    renderWithTheme(<NishkritiLogo size={96} accessibilityLabel="num-logo" />)
    expect(screen.getByLabelText('num-logo')).toBeTruthy()
  })

  it('omits the decorative pulse when showPulse is false', () => {
    renderWithTheme(<NishkritiLogo showPulse={false} accessibilityLabel="quiet-logo" />)
    expect(screen.getByLabelText('quiet-logo')).toBeTruthy()
  })

  it('respects a custom accessibility label', () => {
    renderWithTheme(<NishkritiLogo accessibilityLabel="Company mark" />)
    expect(screen.getByLabelText('Company mark')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<NishkritiLogo accessibilityLabel="snap-logo" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
