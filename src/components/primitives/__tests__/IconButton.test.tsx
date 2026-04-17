// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '../Text'

import { IconButton } from '../IconButton'

describe('IconButton', () => {
  const icon = <Text>→</Text>

  it('renders with its accessibility label', () => {
    renderWithTheme(<IconButton icon={icon} accessibilityLabel="Go forward" />)
    expect(screen.getByRole('button', { name: 'Go forward' })).toBeTruthy()
  })

  it('fires onPress when tapped', () => {
    const onPress = vi.fn()
    renderWithTheme(<IconButton icon={icon} accessibilityLabel="press" onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: 'press' }))
    expect(onPress).toHaveBeenCalled()
  })

  it('renders every variant without crashing', () => {
    const variants = ['ghost', 'filled', 'tonal'] as const
    for (const variant of variants) {
      const { unmount } = renderWithTheme(
        <IconButton icon={icon} accessibilityLabel={variant} variant={variant} />
      )
      expect(screen.getByLabelText(variant)).toBeTruthy()
      unmount()
    }
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<IconButton icon={icon} accessibilityLabel="snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
