// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    renderWithTheme(<EmptyState title="No patients" description="Check back tomorrow" />)
    expect(screen.getByText('No patients')).toBeTruthy()
    expect(screen.getByText('Check back tomorrow')).toBeTruthy()
  })

  it('composes accessibility label', () => {
    renderWithTheme(<EmptyState title="Empty" description="Nothing here" />)
    expect(screen.getByLabelText('Empty. Nothing here')).toBeTruthy()
  })

  it('fires the action callback', () => {
    const onPress = vi.fn()
    renderWithTheme(<EmptyState title="No items" action={{ label: 'Refresh', onPress }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(onPress).toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<EmptyState title="Snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
