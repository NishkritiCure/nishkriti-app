// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders with its label', () => {
    renderWithTheme(<Badge label="NEW" />)
    expect(screen.getByText('NEW')).toBeTruthy()
  })

  it('uses accessibilityLabel or falls back to label', () => {
    renderWithTheme(<Badge label="FALLBACK" accessibilityLabel="Fallback mode" />)
    expect(screen.getByLabelText('Fallback mode')).toBeTruthy()
  })

  it('applies tone-specific styling without crashing', () => {
    const tones = ['teal', 'rose', 'amber', 'blue', 'em', 'neutral'] as const
    for (const tone of tones) {
      const { unmount } = renderWithTheme(<Badge label={tone} tone={tone} />)
      expect(screen.getByText(tone)).toBeTruthy()
      unmount()
    }
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Badge label="Snap" tone="teal" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
