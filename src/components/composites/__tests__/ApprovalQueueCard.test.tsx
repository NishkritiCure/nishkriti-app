// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { ApprovalQueueCard } from '../ApprovalQueueCard'

const patient = {
  id: 'p1',
  name: 'Ravi K',
  condition: 'T2D',
  daysInProgramme: 21,
  avatarInitials: 'RK',
} as const

describe('ApprovalQueueCard', () => {
  it('renders name, condition, and day counter', () => {
    renderWithTheme(
      <ApprovalQueueCard
        patient={patient}
        todayVitals={{ fbs: 150 }}
        aiReasoningPreview="Morning FBS trending up"
        generatedBy="ai_agent"
        onPress={vi.fn()}
      />
    )
    expect(screen.getByText('Ravi K')).toBeTruthy()
    expect(screen.getByText(/T2D · Day 21/)).toBeTruthy()
    expect(screen.getByText(/Morning FBS/)).toBeTruthy()
  })

  it('surfaces the origin badge', () => {
    renderWithTheme(
      <ApprovalQueueCard
        patient={patient}
        todayVitals={{}}
        aiReasoningPreview="x"
        generatedBy="rule_engine"
        onPress={vi.fn()}
      />
    )
    expect(screen.getByText('Fallback')).toBeTruthy()
  })

  it('renders the fallback strapline when flagged', () => {
    renderWithTheme(
      <ApprovalQueueCard
        patient={patient}
        todayVitals={{}}
        aiReasoningPreview="x"
        generatedBy="rule_engine"
        fallbackBadge
        onPress={vi.fn()}
      />
    )
    expect(screen.getAllByText(/fallback/i).length).toBeGreaterThan(0)
  })

  it('fires onPress', () => {
    const onPress = vi.fn()
    renderWithTheme(
      <ApprovalQueueCard
        patient={patient}
        todayVitals={{ fbs: 142, weight: 82 }}
        aiReasoningPreview="x"
        generatedBy="ai_agent"
        onPress={onPress}
      />
    )
    // Default a11y label is PHI-free ("Approval queue item"); callers
    // override with scrubbed content in Phase D.
    const cards = screen.getAllByRole('button', { name: /Approval queue item/ })
    fireEvent.click(cards[cards.length - 1]!)
    expect(onPress).toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <ApprovalQueueCard
        patient={patient}
        todayVitals={{ fbs: 120 }}
        aiReasoningPreview="ok"
        generatedBy="ai_agent"
        onPress={vi.fn()}
      />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
