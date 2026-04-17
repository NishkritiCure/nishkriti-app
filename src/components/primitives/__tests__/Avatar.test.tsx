// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Avatar } from '../Avatar'

describe('Avatar', () => {
  it('renders the first two initials uppercased', () => {
    renderWithTheme(<Avatar initials="anand" />)
    expect(screen.getByText('AN')).toBeTruthy()
  })

  it('falls back to `??` when no initials are supplied', () => {
    renderWithTheme(<Avatar accessibilityLabel="empty" />)
    expect(screen.getByText('??')).toBeTruthy()
  })

  it('renders every named size without crashing', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const
    for (const size of sizes) {
      const { unmount } = renderWithTheme(<Avatar initials="AB" size={size} />)
      expect(screen.getByLabelText('Avatar AB')).toBeTruthy()
      unmount()
    }
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Avatar initials="SN" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
