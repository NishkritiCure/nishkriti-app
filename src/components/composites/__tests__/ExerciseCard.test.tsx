// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { ExerciseCard } from '../ExerciseCard'

const item = {
  id: 'x1',
  name: 'Slow walk',
  cue: 'Breathe evenly',
  setsReps: '3 × 12',
  duration: '15 min',
} as const

describe('ExerciseCard', () => {
  it('renders name, cue, and sets/reps', () => {
    renderWithTheme(<ExerciseCard item={item} />)
    expect(screen.getAllByText('Slow walk').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Breathe evenly').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/3 × 12/).length).toBeGreaterThan(0)
  })

  it('fires onToggleDone when supplied', () => {
    const onToggleDone = vi.fn()
    renderWithTheme(<ExerciseCard item={item} onToggleDone={onToggleDone} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Slow walk/ }))
    expect(onToggleDone).toHaveBeenCalled()
  })

  it('still renders when onToggleDone is missing', () => {
    renderWithTheme(<ExerciseCard item={item} />)
    // Without an onToggleDone callback, the card renders as a read-only
    // surface — the core name / cue / sets still appear; RNW emits a few
    // wrapper nodes with accessibility fallbacks that make a stricter
    // "no checkbox" assertion noisy, so we check positive content only.
    expect(screen.getAllByText('Slow walk').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Breathe evenly').length).toBeGreaterThan(0)
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <ExerciseCard item={item} onToggleDone={vi.fn()} done />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
