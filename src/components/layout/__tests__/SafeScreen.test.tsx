// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { SafeScreen } from '../SafeScreen'

describe('SafeScreen', () => {
  it('renders its children', () => {
    renderWithTheme(
      <SafeScreen>
        <Text>Safe</Text>
      </SafeScreen>
    )
    expect(screen.getByText('Safe')).toBeTruthy()
  })

  it('supports the scrollable prop', () => {
    renderWithTheme(
      <SafeScreen scrollable>
        <Text>Scroll</Text>
      </SafeScreen>
    )
    expect(screen.getByText('Scroll')).toBeTruthy()
  })

  it('accepts custom edges', () => {
    renderWithTheme(
      <SafeScreen edges={['top', 'bottom']}>
        <Text>Custom</Text>
      </SafeScreen>
    )
    expect(screen.getByText('Custom')).toBeTruthy()
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(
      <SafeScreen>
        <Text>Snap</Text>
      </SafeScreen>
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
