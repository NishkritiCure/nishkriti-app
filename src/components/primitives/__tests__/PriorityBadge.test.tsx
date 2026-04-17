// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { PriorityBadge } from '../PriorityBadge'

describe('PriorityBadge', () => {
  it('renders default labels per level', () => {
    renderWithTheme(<PriorityBadge level="critical" />)
    expect(screen.getByText('Critical')).toBeTruthy()
  })

  it('accepts a custom label', () => {
    renderWithTheme(<PriorityBadge level="high" label="Urgent" />)
    expect(screen.getByText('Urgent')).toBeTruthy()
  })

  it('exposes a descriptive accessibility label', () => {
    renderWithTheme(<PriorityBadge level="low" />)
    expect(screen.getByLabelText('Priority: Low')).toBeTruthy()
  })

  it('matches light + dark snapshots per level', () => {
    const { light, dark } = renderBothThemes(<PriorityBadge level="medium" />)
    expect(light.container.firstChild).toMatchSnapshot('light-medium')
    expect(dark.container.firstChild).toMatchSnapshot('dark-medium')
  })
})
