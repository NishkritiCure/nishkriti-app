// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'
import { useThemeStore } from '@/stores/useThemeStore'

import { ThemeToggle } from '../ThemeToggle'

describe('ThemeToggle', () => {
  it('renders three segments', () => {
    renderWithTheme(<ThemeToggle />)
    expect(screen.getByText('Light')).toBeTruthy()
    expect(screen.getByText('Auto')).toBeTruthy()
    expect(screen.getByText('Dark')).toBeTruthy()
  })

  it('calls setMode when a segment is pressed', () => {
    renderWithTheme(<ThemeToggle testID="t" />)
    fireEvent.click(screen.getAllByTestId('t-dark')[0]!)
    expect(useThemeStore.getState().mode).toBe('dark')
  })

  it('exposes radiogroup role', () => {
    renderWithTheme(<ThemeToggle />)
    expect(screen.getAllByRole('radiogroup', { name: 'Appearance' }).length).toBeGreaterThan(0)
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(<ThemeToggle />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
