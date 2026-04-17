// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'

import { BatchApproveSheet } from '../BatchApproveSheet'

const items = [
  { id: 'a', label: 'Plan A' },
  { id: 'b', label: 'Plan B', secondary: 'FBS 130' },
  { id: 'c', label: 'Plan C' },
] as const

describe('BatchApproveSheet', () => {
  it('renders each item', () => {
    renderWithTheme(
      <BatchApproveSheet
        visible
        items={items}
        selectedIds={[]}
        onToggle={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeTruthy()
    }
  })

  it('calls onToggle when a row is pressed', () => {
    const onToggle = vi.fn()
    renderWithTheme(
      <BatchApproveSheet
        visible
        items={items}
        selectedIds={['a']}
        onToggle={onToggle}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    const rows = screen.getAllByRole('checkbox', { name: 'Plan B' })
    fireEvent.click(rows[rows.length - 1]!)
    expect(onToggle).toHaveBeenCalledWith('b')
  })

  it('disables the confirm button when nothing is selected', () => {
    const onConfirm = vi.fn()
    renderWithTheme(
      <BatchApproveSheet
        visible
        items={items}
        selectedIds={[]}
        onToggle={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    )
    const approves = screen.getAllByRole('button', { name: 'Approve' })
    fireEvent.click(approves[approves.length - 1]!)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('passes the selected ids when approve is pressed', () => {
    const onConfirm = vi.fn()
    renderWithTheme(
      <BatchApproveSheet
        visible
        items={items}
        selectedIds={['a', 'c']}
        onToggle={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    )
    const approves = screen.getAllByRole('button', { name: 'Approve (2)' })
    fireEvent.click(approves[approves.length - 1]!)
    expect(onConfirm).toHaveBeenCalledWith(['a', 'c'])
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(
      <BatchApproveSheet
        visible
        items={items}
        selectedIds={['b']}
        onToggle={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
