// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { CheckInStep } from '../CheckInStep'

describe('CheckInStep', () => {
  it('renders step counter, title, and body', () => {
    renderWithTheme(
      <CheckInStep stepNumber={2} totalSteps={5} title="How do you feel?">
        <Text>Body</Text>
      </CheckInStep>
    )
    expect(screen.getByText('Step 2 of 5')).toBeTruthy()
    expect(screen.getByText('How do you feel?')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
  })

  it('wires back and next callbacks', () => {
    const onBack = vi.fn()
    const onNext = vi.fn()
    renderWithTheme(
      <CheckInStep stepNumber={1} totalSteps={3} title="x" onBack={onBack} onNext={onNext}>
        <Text>Body</Text>
      </CheckInStep>
    )
    const back = screen.getAllByRole('button', { name: 'Back' })
    fireEvent.click(back[back.length - 1]!)
    const next = screen.getAllByRole('button', { name: 'Continue' })
    fireEvent.click(next[next.length - 1]!)
    expect(onBack).toHaveBeenCalled()
    expect(onNext).toHaveBeenCalled()
  })

  it('disables next when nextDisabled', () => {
    const onNext = vi.fn()
    renderWithTheme(
      <CheckInStep stepNumber={1} totalSteps={3} title="x" nextDisabled onNext={onNext}>
        <Text>Body</Text>
      </CheckInStep>
    )
    const next = screen.getAllByRole('button', { name: 'Continue' })
    fireEvent.click(next[next.length - 1]!)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <CheckInStep stepNumber={1} totalSteps={2} title="Snap">
        <Text>body</Text>
      </CheckInStep>
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
