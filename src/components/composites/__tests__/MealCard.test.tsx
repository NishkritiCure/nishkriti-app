// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { MealCard } from '../MealCard'

const item = {
  id: 'm1',
  name: 'Rajma Chawal',
  macros: { calories: 420, carbs: 55, protein: 18, fat: 12 },
  ingredients: [{ name: 'Rajma', quantity: '1 cup' }],
  prepNote: 'Serve warm',
} as const

describe('MealCard', () => {
  it('renders slot + name', () => {
    renderWithTheme(<MealCard slot="lunch" item={item} />)
    expect(screen.getByText('Lunch')).toBeTruthy()
    expect(screen.getByText('Rajma Chawal')).toBeTruthy()
  })

  it('renders macros', () => {
    renderWithTheme(<MealCard slot="lunch" item={item} />)
    expect(screen.getAllByText('420').length).toBeGreaterThan(0)
    expect(screen.getAllByText('55g').length).toBeGreaterThan(0)
  })

  it('expands ingredients when toggled', () => {
    renderWithTheme(<MealCard slot="lunch" item={item} testID="meal" />)
    const toggles = screen.getAllByRole('button', { name: /Toggle Rajma Chawal/ })
    fireEvent.click(toggles[toggles.length - 1]!)
    expect(screen.getAllByText(/Rajma — 1 cup/).length).toBeGreaterThan(0)
    expect(screen.getByText('Serve warm')).toBeTruthy()
  })

  it('uses controlled expanded when provided', () => {
    const onToggle = vi.fn()
    renderWithTheme(<MealCard slot="dinner" item={item} expanded onToggleExpand={onToggle} />)
    expect(screen.getAllByText(/Rajma — 1 cup/).length).toBeGreaterThan(0)
    const toggles = screen.getAllByRole('button', { name: /Toggle/ })
    fireEvent.click(toggles[toggles.length - 1]!)
    expect(onToggle).toHaveBeenCalled()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<MealCard slot="breakfast" item={item} />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
