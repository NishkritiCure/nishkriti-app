// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Stepper } from '../Stepper'

describe('Stepper', () => {
  it('renders the current value', () => {
    renderWithTheme(<Stepper value={5} onChange={vi.fn()} accessibilityLabel="Servings" />)
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('increments on + press', () => {
    const onChange = vi.fn()
    renderWithTheme(
      <Stepper value={3} onChange={onChange} accessibilityLabel="Count" max={10} testID="stepper" />
    )
    const incButtons = screen.getAllByTestId('stepper-increment')
    fireEvent.click(incButtons[incButtons.length - 1]!)
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('decrements on − press', () => {
    const onChange = vi.fn()
    renderWithTheme(
      <Stepper value={3} onChange={onChange} accessibilityLabel="Count" min={0} testID="stepper" />
    )
    const buttons = screen.getAllByTestId('stepper-decrement')
    fireEvent.click(buttons[buttons.length - 1]!)
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('refuses to go below min', () => {
    const onChange = vi.fn()
    renderWithTheme(
      <Stepper value={0} onChange={onChange} accessibilityLabel="Count" min={0} testID="stepper" />
    )
    const buttons = screen.getAllByTestId('stepper-decrement')
    fireEvent.click(buttons[buttons.length - 1]!)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <Stepper value={5} onChange={vi.fn()} accessibilityLabel="snap" />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
