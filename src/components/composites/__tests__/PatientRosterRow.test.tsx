// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { PatientRosterRow } from '../PatientRosterRow'

describe('PatientRosterRow', () => {
  it('renders name, condition, and day counter', () => {
    renderWithTheme(
      <PatientRosterRow
        avatarInitials="AS"
        name="Anu Shah"
        condition="Type 2 diabetes"
        daysInProgramme={42}
        onPress={vi.fn()}
      />
    )
    expect(screen.getByText('Anu Shah')).toBeTruthy()
    expect(screen.getByText('Type 2 diabetes')).toBeTruthy()
    expect(screen.getByText('42')).toBeTruthy()
  })

  it('fires onPress', () => {
    const onPress = vi.fn()
    renderWithTheme(
      <PatientRosterRow
        avatarInitials="AS"
        name="Anu"
        condition="T2D"
        daysInProgramme={1}
        onPress={onPress}
      />
    )
    // Default a11y label is PHI-free ("Patient row"); callers override
    // with a scrubbed label in Phase D.
    const rows = screen.getAllByRole('button', { name: /Patient row/ })
    fireEvent.click(rows[rows.length - 1]!)
    expect(onPress).toHaveBeenCalled()
  })

  it('renders an optional status pill', () => {
    renderWithTheme(
      <PatientRosterRow
        avatarInitials="AS"
        name="Anu"
        condition="T2D"
        daysInProgramme={10}
        statusPillLabel="Urgent"
        statusPillColor="rose"
        onPress={vi.fn()}
      />
    )
    expect(screen.getByText('Urgent')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <PatientRosterRow
        avatarInitials="SN"
        name="Snap"
        condition="c"
        daysInProgramme={5}
        onPress={vi.fn()}
      />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
