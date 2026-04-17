// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { ChartCard } from '../ChartCard'

describe('ChartCard', () => {
  it('renders title and chart child', () => {
    renderWithTheme(
      <ChartCard title="FBS" summary="7-day avg 138">
        <Text>[chart]</Text>
      </ChartCard>
    )
    expect(screen.getByText('FBS')).toBeTruthy()
    expect(screen.getByText('7-day avg 138')).toBeTruthy()
    expect(screen.getByText('[chart]')).toBeTruthy()
  })

  it('composes an accessibility label', () => {
    renderWithTheme(
      <ChartCard title="Weight" summary="−1.2 kg this week">
        <Text>[chart]</Text>
      </ChartCard>
    )
    expect(screen.getAllByLabelText('Weight. −1.2 kg this week').length).toBeGreaterThan(0)
  })

  it('omits summary when not provided', () => {
    renderWithTheme(
      <ChartCard title="Steps">
        <Text>[chart]</Text>
      </ChartCard>
    )
    expect(screen.getByText('Steps')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <ChartCard title="Snap">
        <Text>[chart]</Text>
      </ChartCard>
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
