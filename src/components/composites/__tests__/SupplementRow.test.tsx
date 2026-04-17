// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { SupplementRow } from '../SupplementRow'

describe('SupplementRow', () => {
  it('renders name, dose, and schedule', () => {
    renderWithTheme(
      <SupplementRow name="Metformin" dose="500mg" time="08:00" taken={false} onToggle={vi.fn()} />
    )
    expect(screen.getByText('Metformin')).toBeTruthy()
    expect(screen.getByText('500mg · 08:00')).toBeTruthy()
  })

  it('fires onToggle when checkbox is pressed', () => {
    const onToggle = vi.fn()
    renderWithTheme(
      <SupplementRow name="Vit D" dose="1000 IU" time="morning" taken={false} onToggle={onToggle} />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /Vit D/ }))
    expect(onToggle).toHaveBeenCalled()
  })

  it('announces taken state in the accessibility label', () => {
    renderWithTheme(<SupplementRow name="B12" time="noon" taken onToggle={vi.fn()} />)
    expect(screen.getAllByLabelText(/Taken/).length).toBeGreaterThan(0)
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <SupplementRow name="Snap" dose="1g" time="am" taken onToggle={vi.fn()} />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
