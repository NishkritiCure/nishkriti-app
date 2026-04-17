// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Pill } from '../Pill'

describe('Pill', () => {
  it('renders its label', () => {
    renderWithTheme(<Pill label="ON TARGET" tone="teal" />)
    expect(screen.getByText('ON TARGET')).toBeTruthy()
  })

  it('renders every tone without crashing', () => {
    const tones = ['teal', 'amber', 'rose', 'blue', 'em', 'dim'] as const
    for (const tone of tones) {
      const { unmount } = renderWithTheme(<Pill label={tone} tone={tone} />)
      expect(screen.getByText(tone)).toBeTruthy()
      unmount()
    }
  })

  it('becomes pressable when onPress is provided', () => {
    const onPress = vi.fn()
    renderWithTheme(<Pill label="TAP" tone="teal" onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: 'TAP' }))
    expect(onPress).toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Pill label="SNAP" tone="amber" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
