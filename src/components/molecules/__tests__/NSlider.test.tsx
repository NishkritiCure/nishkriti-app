// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { NSlider } from '../NSlider'

describe('NSlider', () => {
  it('renders with value and unit', () => {
    renderWithTheme(
      <NSlider
        min={0}
        max={10}
        value={5}
        unit="mg"
        onValueChange={vi.fn()}
        accessibilityLabel="Dose"
      />
    )
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText(/mg/)).toBeTruthy()
  })

  it('exposes role=adjustable with accessibility value', () => {
    renderWithTheme(
      <NSlider min={0} max={100} value={42} onValueChange={vi.fn()} accessibilityLabel="FBS" />
    )
    const slider = screen.getByRole('slider', { name: 'FBS' })
    expect(slider).toBeTruthy()
  })

  it('ignores pan when disabled', () => {
    const onValueChange = vi.fn()
    renderWithTheme(
      <NSlider
        min={0}
        max={10}
        value={5}
        disabled
        onValueChange={onValueChange}
        accessibilityLabel="Locked"
      />
    )
    expect(screen.getByRole('slider', { name: 'Locked' })).toBeTruthy()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <NSlider min={0} max={10} value={5} onValueChange={vi.fn()} accessibilityLabel="snap" />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
