// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { Screen } from '../Screen'

describe('Screen', () => {
  it('renders its children', () => {
    renderWithTheme(
      <Screen>
        <Text>Hi</Text>
      </Screen>
    )
    expect(screen.getByText('Hi')).toBeTruthy()
  })

  it('becomes a scroll view when scrollable', () => {
    renderWithTheme(
      <Screen scrollable testID="s">
        <Text>Scroll me</Text>
      </Screen>
    )
    expect(screen.getByText('Scroll me')).toBeTruthy()
  })

  it('accepts a custom padding', () => {
    renderWithTheme(
      <Screen padding={24} testID="s">
        <Text>Padded</Text>
      </Screen>
    )
    expect(screen.getByText('Padded')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <Screen>
        <Text>Snap</Text>
      </Screen>
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
