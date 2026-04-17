// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'

import { MealSwapPicker } from '../MealSwapPicker'

const options = [
  { id: '1', name: 'Rajma Chawal', calories: 420, subtitle: '35g protein' },
  { id: '2', name: 'Paneer Bowl', calories: 380 },
] as const

describe('MealSwapPicker', () => {
  it('renders each option', () => {
    renderWithTheme(
      <MealSwapPicker visible options={options} onPick={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByText('Rajma Chawal')).toBeTruthy()
    expect(screen.getByText('Paneer Bowl')).toBeTruthy()
  })

  it('highlights the current selection', () => {
    renderWithTheme(
      <MealSwapPicker visible options={options} currentId="2" onPick={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getAllByLabelText(/current selection/).length).toBeGreaterThan(0)
  })

  it('calls onPick with the selected id', () => {
    const onPick = vi.fn()
    renderWithTheme(<MealSwapPicker visible options={options} onPick={onPick} onCancel={vi.fn()} />)
    const opts = screen.getAllByRole('button', { name: /Rajma Chawal/ })
    fireEvent.click(opts[opts.length - 1]!)
    expect(onPick).toHaveBeenCalledWith('1')
  })

  it('calls onCancel via Cancel button', () => {
    const onCancel = vi.fn()
    renderWithTheme(
      <MealSwapPicker visible options={options} onPick={vi.fn()} onCancel={onCancel} />
    )
    const cancels = screen.getAllByRole('button', { name: 'Cancel' })
    fireEvent.click(cancels[cancels.length - 1]!)
    expect(onCancel).toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(
      <MealSwapPicker visible options={options} onPick={vi.fn()} onCancel={vi.fn()} />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
