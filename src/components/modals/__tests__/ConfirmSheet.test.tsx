// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'

import { ConfirmSheet } from '../ConfirmSheet'

describe('ConfirmSheet', () => {
  it('renders title and description', () => {
    renderWithTheme(
      <ConfirmSheet
        visible
        title="Approve?"
        description="This will finalise the plan."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('Approve?')).toBeTruthy()
    expect(screen.getByText(/finalise/i)).toBeTruthy()
  })

  it('calls onConfirm', () => {
    const onConfirm = vi.fn()
    renderWithTheme(<ConfirmSheet visible title="?" onConfirm={onConfirm} onCancel={vi.fn()} />)
    const confirms = screen.getAllByRole('button', { name: 'Confirm' })
    fireEvent.click(confirms[confirms.length - 1]!)
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel', () => {
    const onCancel = vi.fn()
    renderWithTheme(<ConfirmSheet visible title="?" onConfirm={vi.fn()} onCancel={onCancel} />)
    const cancels = screen.getAllByRole('button', { name: 'Cancel' })
    fireEvent.click(cancels[cancels.length - 1]!)
    expect(onCancel).toHaveBeenCalled()
  })

  it('renders the destructive variant', () => {
    renderWithTheme(
      <ConfirmSheet
        visible
        title="Delete"
        destructive
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy()
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(
      <ConfirmSheet visible title="Snap" onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
