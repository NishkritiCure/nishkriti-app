// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { KeyboardAvoidingScreen } from '../KeyboardAvoidingScreen'

describe('KeyboardAvoidingScreen', () => {
  it('renders its children', () => {
    renderWithTheme(
      <KeyboardAvoidingScreen>
        <Text>Content</Text>
      </KeyboardAvoidingScreen>
    )
    expect(screen.getByText('Content')).toBeTruthy()
  })

  it('accepts an offset prop', () => {
    renderWithTheme(
      <KeyboardAvoidingScreen offset={64}>
        <Text>Offset</Text>
      </KeyboardAvoidingScreen>
    )
    expect(screen.getByText('Offset')).toBeTruthy()
  })

  it('passes through scrollable prop', () => {
    renderWithTheme(
      <KeyboardAvoidingScreen scrollable>
        <Text>Scroll</Text>
      </KeyboardAvoidingScreen>
    )
    expect(screen.getByText('Scroll')).toBeTruthy()
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(
      <KeyboardAvoidingScreen>
        <Text>Snap</Text>
      </KeyboardAvoidingScreen>
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
