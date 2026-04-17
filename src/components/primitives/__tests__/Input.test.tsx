// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Input } from '../Input'

describe('Input', () => {
  it('renders its label', () => {
    renderWithTheme(<Input label="Email" />)
    expect(screen.getByText('Email')).toBeTruthy()
  })

  it('calls onChangeText when the user types', () => {
    const onChangeText = vi.fn()
    renderWithTheme(<Input label="Name" onChangeText={onChangeText} />)
    const input = screen.getByLabelText('Name')
    fireEvent.input(input, { target: { value: 'Anand' } })
    expect(onChangeText).toHaveBeenCalled()
  })

  it('shows error text when provided', () => {
    renderWithTheme(<Input label="PIN" errorText="Must be 4 digits" />)
    expect(screen.getByText('Must be 4 digits')).toBeTruthy()
  })

  it('marks required fields with an asterisk', () => {
    renderWithTheme(<Input label="Age" required />)
    expect(screen.getByText('Age *')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Input label="Snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
