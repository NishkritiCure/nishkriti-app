// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { PhaseCard } from '../PhaseCard'

describe('PhaseCard', () => {
  it('renders phase name and progress', () => {
    renderWithTheme(
      <PhaseCard
        phaseName="Stabilise"
        phaseNumber={2}
        totalPhases={4}
        dayInPhase={10}
        totalDaysInPhase={30}
      />
    )
    expect(screen.getByText('Stabilise')).toBeTruthy()
    expect(screen.getByText('Phase 2 / 4')).toBeTruthy()
    expect(screen.getByText('Day 10 / 30')).toBeTruthy()
  })

  it('computes percent complete', () => {
    renderWithTheme(
      <PhaseCard
        phaseName="x"
        phaseNumber={1}
        totalPhases={2}
        dayInPhase={6}
        totalDaysInPhase={8}
      />
    )
    expect(screen.getByText('75%')).toBeTruthy()
  })

  it('clamps and handles zero totalDaysInPhase', () => {
    renderWithTheme(
      <PhaseCard
        phaseName="x"
        phaseNumber={1}
        totalPhases={2}
        dayInPhase={99}
        totalDaysInPhase={0}
      />
    )
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <PhaseCard
        phaseName="Snap"
        phaseNumber={1}
        totalPhases={3}
        dayInPhase={2}
        totalDaysInPhase={10}
      />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
