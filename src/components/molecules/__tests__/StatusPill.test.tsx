// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { StatusPill } from '../StatusPill'

describe('StatusPill', () => {
  it('renders the label', () => {
    renderWithTheme(<StatusPill level="ok" label="On target" />)
    expect(screen.getByText('On target')).toBeTruthy()
  })

  it('composes status + label into the accessibility label', () => {
    renderWithTheme(<StatusPill level="critical" label="Urgent" />)
    expect(screen.getByLabelText('Urgent (critical)')).toBeTruthy()
  })

  it('renders every level without crashing', () => {
    const levels = ['ok', 'warn', 'alert', 'critical', 'info'] as const
    for (const level of levels) {
      const { unmount } = renderWithTheme(<StatusPill level={level} label={level} />)
      expect(screen.getByText(level)).toBeTruthy()
      unmount()
    }
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<StatusPill level="warn" label="snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
