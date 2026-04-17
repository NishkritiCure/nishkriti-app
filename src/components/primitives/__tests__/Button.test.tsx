// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Button } from '../Button'

describe('Button', () => {
  it('renders with its label', () => {
    renderWithTheme(<Button label="Save" />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('calls onPress when clicked', () => {
    const onPress = vi.fn()
    renderWithTheme(<Button label="Click" onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('disables press while loading', () => {
    const onPress = vi.fn()
    renderWithTheme(<Button label="Loading" loading onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: 'Loading' }))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('disables press when disabled', () => {
    const onPress = vi.fn()
    renderWithTheme(<Button label="Disabled" disabled onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: 'Disabled' }))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('uses accessibilityLabel override when provided', () => {
    renderWithTheme(<Button label="Go" accessibilityLabel="Proceed to checkout" />)
    expect(screen.getByLabelText('Proceed to checkout')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Button label="Snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
