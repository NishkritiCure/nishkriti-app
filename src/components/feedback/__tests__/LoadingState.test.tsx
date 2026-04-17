// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'

import { LoadingState } from '../LoadingState'

describe('LoadingState', () => {
  it('renders with the default label', () => {
    renderWithTheme(<LoadingState />)
    expect(screen.getByText(/Loading/i)).toBeTruthy()
  })

  it('accepts a custom label', () => {
    renderWithTheme(<LoadingState label="Fetching plan…" />)
    expect(screen.getByText('Fetching plan…')).toBeTruthy()
  })

  it('exposes progressbar role', () => {
    renderWithTheme(<LoadingState label="Signing in" />)
    expect(screen.getAllByRole('progressbar', { name: 'Signing in' }).length).toBeGreaterThan(0)
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(<LoadingState />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
