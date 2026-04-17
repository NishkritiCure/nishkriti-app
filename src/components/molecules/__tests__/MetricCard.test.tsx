// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { MetricCard } from '../MetricCard'

describe('MetricCard', () => {
  it('renders label, value, and unit', () => {
    renderWithTheme(<MetricCard label="FBS" value={142} unit="mg/dL" />)
    expect(screen.getByText('FBS')).toBeTruthy()
    expect(screen.getByText('142')).toBeTruthy()
    expect(screen.getByText('mg/dL')).toBeTruthy()
  })

  it('renders delta indicator when supplied', () => {
    renderWithTheme(<MetricCard label="Weight" value={72} delta="1.2 kg" deltaPositive={false} />)
    expect(screen.getByText(/1\.2 kg/)).toBeTruthy()
  })

  it('fires onPress for drill-down', () => {
    const onPress = vi.fn()
    renderWithTheme(<MetricCard label="FBS" value={142} unit="mg/dL" onPress={onPress} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <MetricCard label="Snap" value={100} unit="x" status="warn" />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
