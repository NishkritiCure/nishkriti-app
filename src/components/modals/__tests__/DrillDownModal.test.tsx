// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { DrillDownModal } from '../DrillDownModal'

describe('DrillDownModal', () => {
  it('renders title and children when visible', () => {
    renderWithTheme(
      <DrillDownModal visible title="History" onDismiss={vi.fn()}>
        <Text>Row 1</Text>
      </DrillDownModal>
    )
    expect(screen.getByText('History')).toBeTruthy()
    expect(screen.getByText('Row 1')).toBeTruthy()
  })

  it('does not render content when not visible', () => {
    renderWithTheme(
      <DrillDownModal visible={false} title="Hidden" onDismiss={vi.fn()}>
        <Text>Ghost</Text>
      </DrillDownModal>
    )
    expect(screen.queryByText('Hidden')).toBeNull()
  })

  it('invokes onDismiss via close button', () => {
    const onDismiss = vi.fn()
    renderWithTheme(
      <DrillDownModal visible title="X" onDismiss={onDismiss}>
        <Text>body</Text>
      </DrillDownModal>
    )
    const closes = screen.getAllByRole('button', { name: 'Close' })
    fireEvent.click(closes[closes.length - 1]!)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(
      <DrillDownModal visible title="Snap" onDismiss={vi.fn()}>
        <Text>snap</Text>
      </DrillDownModal>
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
