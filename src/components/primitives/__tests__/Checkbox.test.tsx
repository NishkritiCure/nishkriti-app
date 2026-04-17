// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Checkbox } from '../Checkbox'

describe('Checkbox', () => {
  it('renders with its label', () => {
    renderWithTheme(<Checkbox checked={false} onChange={vi.fn()} label="Terms" />)
    expect(screen.getByText('Terms')).toBeTruthy()
  })

  it('toggles on press', () => {
    const onChange = vi.fn()
    renderWithTheme(<Checkbox checked={false} onChange={onChange} label="Agree" />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Agree' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn()
    renderWithTheme(<Checkbox checked disabled onChange={onChange} label="Locked" />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Locked' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Checkbox checked onChange={vi.fn()} label="Snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
