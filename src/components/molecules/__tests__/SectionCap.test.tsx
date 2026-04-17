// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { SectionCap } from '../SectionCap'

describe('SectionCap', () => {
  it('renders its label', () => {
    renderWithTheme(<SectionCap label="Today" />)
    expect(screen.getByText('Today')).toBeTruthy()
  })

  it('exposes header role', () => {
    renderWithTheme(<SectionCap label="Vitals" />)
    expect(screen.getByRole('heading', { name: 'Vitals' })).toBeTruthy()
  })

  it('accepts a custom accessibility label', () => {
    renderWithTheme(<SectionCap label="Plan" accessibilityLabel="Today's plan" />)
    expect(screen.getByLabelText("Today's plan")).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<SectionCap label="Snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
