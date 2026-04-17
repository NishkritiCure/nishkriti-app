// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Tag } from '../Tag'

describe('Tag', () => {
  it('renders with its label', () => {
    renderWithTheme(<Tag label="spicy" />)
    expect(screen.getByText('spicy')).toBeTruthy()
  })

  it('fires onPress when tapped', () => {
    const onPress = vi.fn()
    renderWithTheme(<Tag label="press me" onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: 'press me' }))
    expect(onPress).toHaveBeenCalled()
  })

  it('exposes a remove affordance when onRemove is provided', () => {
    const onRemove = vi.fn()
    renderWithTheme(<Tag label="removable" onRemove={onRemove} testID="t" />)
    fireEvent.click(screen.getByLabelText('Remove removable'))
    expect(onRemove).toHaveBeenCalled()
  })

  it('matches light + dark snapshots in active state', () => {
    const { light, dark } = renderBothThemes(<Tag label="snap" active />)
    expect(light.container.firstChild).toMatchSnapshot('light-active')
    expect(dark.container.firstChild).toMatchSnapshot('dark-active')
  })
})
