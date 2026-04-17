// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Divider } from '../Divider'

describe('Divider', () => {
  it('renders horizontally by default', () => {
    renderWithTheme(<Divider testID="div" />)
    expect(screen.getAllByTestId('div').length).toBeGreaterThan(0)
  })

  it('renders vertically when requested', () => {
    renderWithTheme(<Divider orientation="vertical" testID="div" />)
    expect(screen.getAllByTestId('div').length).toBeGreaterThan(0)
  })

  it('applies inset without crashing', () => {
    renderWithTheme(<Divider inset={16} testID="div" />)
    expect(screen.getAllByTestId('div').length).toBeGreaterThan(0)
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Divider testID="snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
