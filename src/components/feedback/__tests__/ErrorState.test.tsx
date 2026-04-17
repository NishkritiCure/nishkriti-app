// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { ErrorState } from '../ErrorState'

describe('ErrorState', () => {
  it('renders default title and description', () => {
    renderWithTheme(<ErrorState />)
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy()
  })

  it('uses role=alert', () => {
    renderWithTheme(<ErrorState title="Boom" description="Try again" />)
    expect(screen.getAllByRole('alert', { name: 'Boom. Try again' }).length).toBeGreaterThan(0)
  })

  it('fires onRetry', () => {
    const onRetry = vi.fn()
    renderWithTheme(<ErrorState onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<ErrorState title="Snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
