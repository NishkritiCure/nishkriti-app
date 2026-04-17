// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Card } from '../Card'
import { Text } from '../Text'

describe('Card', () => {
  it('renders its children', () => {
    renderWithTheme(
      <Card accessibilityLabel="wrapper">
        <Text>Inside</Text>
      </Card>
    )
    expect(screen.getByText('Inside')).toBeTruthy()
  })

  it('renders as a view by default', () => {
    renderWithTheme(
      <Card accessibilityLabel="static" testID="card">
        <Text>Body</Text>
      </Card>
    )
    expect(screen.getByLabelText('static')).toBeTruthy()
  })

  it('becomes pressable when onPress is provided', () => {
    const onPress = vi.fn()
    renderWithTheme(
      <Card onPress={onPress} accessibilityLabel="tappable">
        <Text>Tap me</Text>
      </Card>
    )
    fireEvent.click(screen.getByRole('button', { name: 'tappable' }))
    expect(onPress).toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <Card accessibilityLabel="snap">
        <Text>Snap</Text>
      </Card>
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
