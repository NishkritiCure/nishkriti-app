// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { FieldRow } from '../FieldRow'

describe('FieldRow', () => {
  it('renders label and value', () => {
    renderWithTheme(<FieldRow label="Age" value="42" />)
    expect(screen.getByText('Age')).toBeTruthy()
    expect(screen.getByText('42')).toBeTruthy()
  })

  it('prefers children over value when both are passed', () => {
    renderWithTheme(
      <FieldRow label="Notes" value="ignored">
        <Text>Custom</Text>
      </FieldRow>
    )
    expect(screen.getByText('Custom')).toBeTruthy()
    expect(screen.queryByText('ignored')).toBeNull()
  })

  it('accepts a custom accessibility label', () => {
    renderWithTheme(<FieldRow label="Status" value="OK" accessibilityLabel="Patient is stable" />)
    expect(screen.getByLabelText('Patient is stable')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<FieldRow label="Snap" value="1" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
