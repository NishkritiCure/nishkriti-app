// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Text } from '../Text'

describe('Text', () => {
  it('renders its children', () => {
    renderWithTheme(<Text>Hello</Text>)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('respects variant prop', () => {
    renderWithTheme(<Text variant="h1">Title</Text>)
    expect(screen.getByText('Title')).toBeTruthy()
  })

  it('accepts custom color', () => {
    renderWithTheme(<Text color="#ff0000">Red</Text>)
    expect(screen.getByText('Red')).toBeTruthy()
  })

  it('applies uppercase transform', () => {
    renderWithTheme(<Text uppercase>shouted</Text>)
    expect(screen.getByText('shouted')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Text variant="h2">Snap</Text>)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
