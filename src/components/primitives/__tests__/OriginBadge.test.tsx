// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { OriginBadge } from '../OriginBadge'

describe('OriginBadge', () => {
  it('labels an AI-generated plan', () => {
    renderWithTheme(<OriginBadge origin="ai_agent" />)
    expect(screen.getByText('AI')).toBeTruthy()
  })

  it('labels a rule-engine fallback', () => {
    renderWithTheme(<OriginBadge origin="rule_engine" />)
    expect(screen.getByText('Fallback')).toBeTruthy()
  })

  it('labels a doctor-direct plan', () => {
    renderWithTheme(<OriginBadge origin="doctor_direct" />)
    expect(screen.getByText('Doctor')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<OriginBadge origin="rule_engine" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
