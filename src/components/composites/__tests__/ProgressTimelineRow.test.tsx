// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { ProgressTimelineRow } from '../ProgressTimelineRow'

describe('ProgressTimelineRow', () => {
  it('renders date, title, and description', () => {
    renderWithTheme(
      <ProgressTimelineRow date="Apr 10" title="Phase 1 complete" description="Onward!" />
    )
    expect(screen.getByText('Apr 10')).toBeTruthy()
    expect(screen.getByText('Phase 1 complete')).toBeTruthy()
    expect(screen.getByText('Onward!')).toBeTruthy()
  })

  it('composes a11y label', () => {
    renderWithTheme(<ProgressTimelineRow date="X" title="Y" description="Z" />)
    expect(screen.getAllByLabelText('X: Y. Z').length).toBeGreaterThan(0)
  })

  it('hides the rail when isLast', () => {
    renderWithTheme(<ProgressTimelineRow date="Q" title="R" isLast />)
    expect(screen.getAllByText('R').length).toBeGreaterThan(0)
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <ProgressTimelineRow date="Apr 18" title="Snap" description="snap" />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
