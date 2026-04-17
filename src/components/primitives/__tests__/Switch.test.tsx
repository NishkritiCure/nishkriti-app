// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Switch } from '../Switch'

describe('Switch', () => {
  it('renders with accessibility label', () => {
    renderWithTheme(<Switch value={false} onValueChange={vi.fn()} accessibilityLabel="Dark mode" />)
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeTruthy()
  })

  it('toggles on press', () => {
    const onValueChange = vi.fn()
    renderWithTheme(
      <Switch value={false} onValueChange={onValueChange} accessibilityLabel="Notifications" />
    )
    fireEvent.click(screen.getByRole('switch', { name: 'Notifications' }))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('ignores press when disabled', () => {
    const onValueChange = vi.fn()
    renderWithTheme(
      <Switch value disabled onValueChange={onValueChange} accessibilityLabel="Locked" />
    )
    fireEvent.click(screen.getByRole('switch', { name: 'Locked' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <Switch value onValueChange={vi.fn()} accessibilityLabel="snap" />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
