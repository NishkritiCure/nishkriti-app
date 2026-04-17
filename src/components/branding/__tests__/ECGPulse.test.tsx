// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { ECGPulse } from '../ECGPulse'

describe('ECGPulse', () => {
  it('renders with its default accessibility label', () => {
    renderWithTheme(<ECGPulse />)
    expect(screen.getByLabelText('ECG pulse animation')).toBeTruthy()
  })

  it('accepts custom width and height props without crashing', () => {
    renderWithTheme(<ECGPulse width={300} height={60} accessibilityLabel="wide-pulse" />)
    expect(screen.getByLabelText('wide-pulse')).toBeTruthy()
  })

  it('accepts a custom stroke color', () => {
    renderWithTheme(<ECGPulse color="#ff0000" accessibilityLabel="red-pulse" />)
    expect(screen.getByLabelText('red-pulse')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <ECGPulse accessibilityLabel="snap-pulse" width={200} height={40} />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
