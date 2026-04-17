// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'

import { Spacer } from '../Spacer'

describe('Spacer', () => {
  it('renders with a vertical size by default', () => {
    renderWithTheme(<Spacer size={16} testID="sp" />)
    expect(screen.getAllByTestId('sp').length).toBeGreaterThan(0)
  })

  it('renders horizontally when requested', () => {
    renderWithTheme(<Spacer horizontal size={20} testID="sp" />)
    expect(screen.getAllByTestId('sp').length).toBeGreaterThan(0)
  })

  it('accepts a flex factor', () => {
    renderWithTheme(<Spacer flex={1} testID="sp" />)
    expect(screen.getAllByTestId('sp').length).toBeGreaterThan(0)
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(<Spacer size={24} testID="sp" />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
